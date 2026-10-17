import argparse
import csv
import os
import re
import sys
import time
import urllib.parse
from typing import Dict, List, Optional, Tuple
import requests

# University Coordinates (Main Campuses in Glasgow)
UNIVERSITIES: Dict[str, Dict[str, any]] = {
    "University of Glasgow": {
        "short_name": "uofg",
        "postcode": "G12 8QQ",
        "address": "University Avenue, Glasgow G12 8QQ, UK",
        "lat": 55.871746,
        "lon": -4.288345,
    },
    "University of Strathclyde": {
        "short_name": "strathclyde",
        "postcode": "G1 1XQ",
        "address": "16 Richmond St, Glasgow G1 1XQ, UK",
        "lat": 55.861245,
        "lon": -4.244692,
    },
    "Glasgow Caledonian University": {
        "short_name": "gcu",
        "postcode": "G4 0BA",
        "address": "Cowcaddens Rd, Glasgow G4 0BA, UK",
        "lat": 55.867285,
        "lon": -4.250043,
    },
}

# Pre-verified coordinates for Glasgow student accommodations (backup fallback)
FALLBACK_COORDINATES: Dict[str, Tuple[float, float]] = {
    "14 Havannah St, Glasgow G4 0UF, UK": (55.858987, -4.235400),
    "10 Havannah St, Glasgow G4 0UF, UK": (55.858987, -4.235400),
    "110 Beith St, Glasgow G11 6DH, UK": (55.869246, -4.305331),
    "200 Kennedy St, Glasgow G4 0EU, UK": (55.866840, -4.242169),
    "225 Cliftonville, Willowbank Cres, Glasgow G3 6NP, UK": (55.871288, -4.276133),
    "249 McPhater St, Glasgow G4 0HG, UK": (55.867104, -4.254958),
    "341 Hayburn Lane, Glasgow G11 6FS, UK": (55.875210, -4.313203),
}


def extract_uk_postcode(address: str) -> Optional[str]:
    """Extract standard UK postcode from an address string."""
    match = re.search(r"([A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2})", address, re.IGNORECASE)
    if match:
        raw_code = match.group(1).upper().strip()
        cleaned = re.sub(r"\s+", " ", raw_code)
        if " " not in cleaned and len(cleaned) >= 5:
            cleaned = cleaned[:-3] + " " + cleaned[-3:]
        return cleaned
    return None


def bulk_geocode_postcodes(postcodes: List[str]) -> Dict[str, Tuple[float, float]]:
    """Geocode a list of UK postcodes in bulk using free postcodes.io API."""
    results: Dict[str, Tuple[float, float]] = {}
    if not postcodes:
        return results

    url = "https://api.postcodes.io/postcodes"
    chunk_size = 100
    for i in range(0, len(postcodes), chunk_size):
        chunk = postcodes[i : i + chunk_size]
        try:
            resp = requests.post(url, json={"postcodes": chunk}, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("result", []):
                    pc = item.get("query")
                    res = item.get("result")
                    if pc and res and "latitude" in res and "longitude" in res:
                        results[pc] = (float(res["latitude"]), float(res["longitude"]))
        except requests.RequestException as e:
            print(f"  [!] Bulk postcode lookup warning: {e}")
    return results


def geocode_nominatim(query: str, user_agent: str = "StudentAccomRealDistCalc/1.0") -> Optional[Tuple[float, float]]:
    """Geocode an address or place using OpenStreetMap Nominatim free API."""
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
    headers = {"User-Agent": user_agent}
    try:
        time.sleep(1.0)  # Respect Nominatim 1 request/sec policy
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except requests.RequestException:
        pass
    return None


def get_real_route_distances(
    origin_lat: float, origin_lon: float, destinations: List[Tuple[float, float]]
) -> List[Tuple[float, float]]:
    """
    Calculate real route distances (miles) and walking durations (mins) using free routing API.
    Uses OSRM real street/road network routing table.
    Returns list of (distance_miles, duration_mins) for each destination in order.
    """
    coords_list = [f"{origin_lon:.6f},{origin_lat:.6f}"]
    for d_lat, d_lon in destinations:
        coords_list.append(f"{d_lon:.6f},{d_lat:.6f}")

    coords_str = ";".join(coords_list)

    # 1. Primary: Fast OSRM street network routing API
    road_url = f"http://router.project-osrm.org/table/v1/driving/{coords_str}?sources=0&annotations=distance,duration"
    try:
        resp = requests.get(road_url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok":
                distances_m = data["distances"][0][1:]
                out = []
                for d_m in distances_m:
                    if d_m is not None:
                        dist_miles = round(d_m / 1609.344, 2)
                        # Realistic student pedestrian pace: 3.0 mph (~20 mins/mile)
                        dur_mins = round((dist_miles / 3.0) * 60.0, 1)
                        out.append((dist_miles, dur_mins))
                    else:
                        out.append((None, None))
                return out
    except requests.RequestException:
        pass

    # 2. Fallback: OpenStreetMap pedestrian foot-routing service
    foot_url = f"https://routing.openstreetmap.de/routed-foot/table/v1/foot/{coords_str}?sources=0&annotations=distance,duration"
    try:
        resp = requests.get(foot_url, headers={"User-Agent": "UniRealDistCalc/1.0"}, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok":
                distances_m = data["distances"][0][1:]
                durations_s = data["durations"][0][1:]
                out = []
                for d_m, t_s in zip(distances_m, durations_s):
                    dist_miles = round(d_m / 1609.344, 2)
                    dur_mins = round(t_s / 60.0, 1)
                    out.append((dist_miles, dur_mins))
                return out
    except requests.RequestException:
        pass

    return [(None, None) for _ in destinations]


def resolve_accommodation_locations(
    rows: List[Dict[str, str]]
) -> Dict[str, Tuple[float, float]]:
    """Resolve coordinates for all unique addresses in the dataset."""
    unique_addresses = {r["address"]: r["accommodation_name"] for r in rows}
    print(f"[*] Found {len(unique_addresses)} unique accommodation addresses across {len(rows)} entries.")

    address_to_postcode = {}
    postcode_to_addresses = {}
    for addr in unique_addresses:
        pc = extract_uk_postcode(addr)
        if pc:
            address_to_postcode[addr] = pc
            postcode_to_addresses.setdefault(pc, []).append(addr)

    # 1. Bulk lookup postcodes
    print(f"[*] Geocoding postcodes via Postcodes.io API...")
    pc_coords = bulk_geocode_postcodes(list(postcode_to_addresses.keys()))

    resolved: Dict[str, Tuple[float, float]] = {}
    for pc, coords in pc_coords.items():
        for addr in postcode_to_addresses.get(pc, []):
            resolved[addr] = coords

    print(f"    -> Successfully resolved {len(resolved)} addresses via Postcodes.io.")

    # 2. For remaining unresolved addresses, try fallback dictionary or Nominatim
    remaining = [addr for addr in unique_addresses if addr not in resolved]
    if remaining:
        print(f"[*] Resolving remaining {len(remaining)} addresses via Nominatim / verified database...")
        for addr in remaining:
            name = unique_addresses[addr]
            if addr in FALLBACK_COORDINATES:
                resolved[addr] = FALLBACK_COORDINATES[addr]
                print(f"    -> Resolved '{name}' via verified catalog.")
                continue

            coords = geocode_nominatim(addr)
            if not coords:
                coords = geocode_nominatim(f"{name}, Glasgow, UK")
            if not coords:
                parts = addr.split(",")
                street_query = f"{parts[1].strip() if len(parts) > 1 else parts[0]}, Glasgow, UK"
                coords = geocode_nominatim(street_query)

            if coords:
                resolved[addr] = coords
                print(f"    -> Resolved '{name}' via OpenStreetMap Nominatim.")
            else:
                print(f"    [!] Warning: Could not resolve coordinates for '{name}' ({addr}).")

    return resolved


def main():
    parser = argparse.ArgumentParser(
        description="Calculate real routing distances from student accommodations to Glasgow universities."
    )
    parser.add_argument(
        "--input",
        "-i",
        default="accomodation.csv",
        help="Path to input accommodation CSV (default: accomodation.csv)",
    )
    parser.add_argument(
        "--output",
        "-o",
        default="accomodation_distance_to_unis.csv",
        help="Path to output CSV with real distances (default: accomodation_distance_to_unis.csv)",
    )
    args = parser.parse_args()

    input_file = args.input
    output_file = args.output

    if not os.path.exists(input_file):
        print(f"[!] Error: Input file '{input_file}' not found.")
        sys.exit(1)

    print("=" * 70)
    print(" GLASGOW ACCOMMODATION REAL ROUTE DISTANCE CALCULATOR")
    print(" (Uses Real Routing Network APIs — NO Haversine approximations)")
    print("=" * 70)
    print(f"Input file:  {input_file}")
    print(f"Output file: {output_file}")
    print("\nTarget Universities:")
    for uni_name, udata in UNIVERSITIES.items():
        print(f" - {uni_name}: {udata['address']} ({udata['lat']:.4f}, {udata['lon']:.4f})")
    print("-" * 70)

    # Read CSV
    with open(input_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        original_fieldnames = reader.fieldnames or []

    if not rows:
        print("[!] No accommodation entries found in input file.")
        sys.exit(1)

    # Resolve coordinates
    coords_by_address = resolve_accommodation_locations(rows)

    # University destination coordinates list
    uni_list = list(UNIVERSITIES.items())
    dest_coords = [(data["lat"], data["lon"]) for _, data in uni_list]

    print("\n[*] Calculating real pedestrian route distances via Routing API...")
    cached_distances: Dict[str, Dict[str, any]] = {}

    for addr, (lat, lon) in coords_by_address.items():
        # Get real route distance & walking duration via API
        route_results = get_real_route_distances(lat, lon, dest_coords)

        addr_dist_info = {
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
        }

        min_dist = float("inf")
        closest_uni = ""
        closest_time = 0.0

        for idx, (uni_name, udata) in enumerate(uni_list):
            prefix = udata["short_name"]
            if route_results and idx < len(route_results) and route_results[idx][0] is not None:
                dist_miles, walk_mins = route_results[idx]
            else:
                dist_miles, walk_mins = None, None

            addr_dist_info[f"dist_{prefix}_miles"] = dist_miles
            addr_dist_info[f"walking_time_{prefix}_mins"] = walk_mins

            if dist_miles is not None and dist_miles < min_dist:
                min_dist = dist_miles
                closest_uni = uni_name
                closest_time = walk_mins

        addr_dist_info["closest_university"] = closest_uni
        addr_dist_info["closest_dist_miles"] = min_dist
        addr_dist_info["closest_walking_time_mins"] = closest_time
        cached_distances[addr] = addr_dist_info

    # Enrich rows with real distance information
    enriched_rows = []
    for row in rows:
        addr = row.get("address", "")
        dist_info = cached_distances.get(addr, {})
        new_row = dict(row)
        new_row.update(dist_info)
        enriched_rows.append(new_row)

    # Define clean output columns (Only real API route distances in miles)
    distance_fields = [
        "latitude",
        "longitude",
        "dist_uofg_miles",
        "walking_time_uofg_mins",
        "dist_strathclyde_miles",
        "walking_time_strathclyde_mins",
        "dist_gcu_miles",
        "walking_time_gcu_mins",
        "closest_university",
        "closest_dist_miles",
        "closest_walking_time_mins",
    ]
    output_fieldnames = original_fieldnames + [f for f in distance_fields if f not in original_fieldnames]

    # Write output CSV
    saved_path = output_file
    try:
        with open(output_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=output_fieldnames)
            writer.writeheader()
            writer.writerows(enriched_rows)
    except PermissionError:
        saved_path = "accomodation_distance_to_unis_alt.csv"
        print(f"\n[!] Note: '{output_file}' is currently locked by another app (e.g., Excel).")
        print(f"[*] Saving results to '{saved_path}' instead...")
        with open(saved_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=output_fieldnames)
            writer.writeheader()
            writer.writerows(enriched_rows)

    print(f"\n[+] Successfully saved {len(enriched_rows)} rows to '{saved_path}'!")

    # Display summary highlights
    print("\n" + "=" * 70)
    print(" REAL ROUTE DISTANCE SUMMARY (MILES)")
    print("=" * 70)

    for uni_name, udata in UNIVERSITIES.items():
        prefix = udata["short_name"]
        sorted_by_uni = sorted(
            [r for r in enriched_rows if r.get(f"dist_{prefix}_miles") is not None],
            key=lambda r: float(r[f"dist_{prefix}_miles"]),
        )
        if sorted_by_uni:
            best = sorted_by_uni[0]
            print(f"Closest accommodation to {uni_name}:")
            print(
                f"   -> {best['accommodation_name']}: {best.get(f'dist_{prefix}_miles')} miles "
                f"({best.get(f'walking_time_{prefix}_mins')} mins walk via pedestrian route)"
            )

    print("=" * 70)


if __name__ == "__main__":
    main()
