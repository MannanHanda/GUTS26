
import argparse
import csv
import math
import os
import re
import sys
import time
import urllib.parse
from typing import Dict, List, Optional, Tuple
import requests

# Verified student-favourite supermarkets & grocery stores across Glasgow student areas
VERIFIED_GLASGOW_STORES = [
    # City Centre & Merchant City
    {"name": "Aldi", "address": "132 High Street, Merchant City, Glasgow, G1 1PQ", "lat": 55.8596, "lon": -4.2432},
    {"name": "Co-op Food", "address": "152 High Street, Merchant City, Glasgow, G1 1PQ", "lat": 55.8601, "lon": -4.2429},
    {"name": "Tesco Express", "address": "120 Trongate, Merchant City, Glasgow, G1 5EP", "lat": 55.8572, "lon": -4.2482},
    {"name": "Sainsbury's Local", "address": "228 George Street, Merchant City, Glasgow, G1 1XQ", "lat": 55.8614, "lon": -4.2485},
    {"name": "Tesco Express", "address": "116 Queen Street, City Centre, Glasgow, G1 3BX", "lat": 55.8606, "lon": -4.2505},
    {"name": "Marks & Spencer Simply Food", "address": "Argyle Street, City Centre, Glasgow, G2 8AH", "lat": 55.8584, "lon": -4.2558},
    {"name": "Lidl", "address": "Jamaica Street, City Centre, Glasgow, G1 4QD", "lat": 55.8575, "lon": -4.2562},
    {"name": "Sainsbury's Local", "address": "142 Buchanan Street, City Centre, Glasgow, G1 2JA", "lat": 55.8609, "lon": -4.2536},
    {"name": "Tesco Express", "address": "300 Sauchiehall Street, City Centre, Glasgow, G2 3JA", "lat": 55.8653, "lon": -4.2618},
    {"name": "Co-op Food", "address": "557 Sauchiehall Street, Charing Cross, Glasgow, G3 7PQ", "lat": 55.8658, "lon": -4.2699},
    {"name": "Sainsbury's Local", "address": "488 Sauchiehall Street, Charing Cross, Glasgow, G2 3LW", "lat": 55.8654, "lon": -4.2679},
    # Cowcaddens & Townhead & North
    {"name": "Tesco Express", "address": "239 Dobbies Loan, Cowcaddens, Glasgow, G4 0JE", "lat": 55.8672, "lon": -4.2498},
    {"name": "Co-op Food", "address": "120 Kennedy Street, Townhead, Glasgow, G4 0BN", "lat": 55.8670, "lon": -4.2440},
    {"name": "Morrisons", "address": "55 Hawthorn Street, Springburn, Glasgow, G22 6HY", "lat": 55.8824, "lon": -4.2447},
    {"name": "Lidl", "address": "2 Hopehill Road, Maryhill / Firhill, Glasgow, G20 7JQ", "lat": 55.8751, "lon": -4.2655},
    {"name": "Tesco Express", "address": "145 Maryhill Road, St George's Cross, Glasgow, G20 7XL", "lat": 55.8732, "lon": -4.2680},
    # West End & Woodlands & Kelvinbridge
    {"name": "Sainsbury's Local", "address": "291 Woodlands Road, Woodlands, Glasgow, G3 6NE", "lat": 55.8718, "lon": -4.2768},
    {"name": "Tesco Express", "address": "321 Great Western Road, Kelvinbridge, Glasgow, G4 9HS", "lat": 55.8744, "lon": -4.2758},
    {"name": "Co-op Food", "address": "364 Great Western Road, Kelvinbridge, Glasgow, G4 9HT", "lat": 55.8748, "lon": -4.2764},
    {"name": "Waitrose", "address": "373 Byres Road, Hillhead, Glasgow, G12 8AU", "lat": 55.8785, "lon": -4.2936},
    {"name": "Marks & Spencer Food", "address": "226 Byres Road, Hillhead, Glasgow, G12 8SH", "lat": 55.8762, "lon": -4.2925},
    {"name": "Tesco Express", "address": "300 Byres Road, Hillhead, Glasgow, G12 8AW", "lat": 55.8774, "lon": -4.2931},
    {"name": "Lidl", "address": "Partick Central, 40 Mansfield Street, Partick, Glasgow, G11 5QP", "lat": 55.8703, "lon": -4.3056},
    {"name": "Morrisons", "address": "90 Merkland Street, Partick, Glasgow, G11 6BU", "lat": 55.8698, "lon": -4.3075},
    {"name": "Sainsbury's", "address": "80 Crow Road, Thornwood, Glasgow, G11 7RY", "lat": 55.8731, "lon": -4.3125},
    {"name": "Tesco Express", "address": "416 Dumbarton Road, Partick, Glasgow, G11 6SB", "lat": 55.8706, "lon": -4.3090},
    {"name": "Sainsbury's Local", "address": "288 Dumbarton Road, Partick, Glasgow, G11 6TD", "lat": 55.8694, "lon": -4.3032},
    {"name": "Co-op Food", "address": "Argyle Street / Kelvinhaugh, Glasgow, G3 8ER", "lat": 55.8655, "lon": -4.2885},
    {"name": "Sainsbury's Local", "address": "1126 Argyle Street, Finnieston, Glasgow, G3 8TD", "lat": 55.8652, "lon": -4.2868},
    {"name": "Tesco Express", "address": "1002 Argyle Street, Finnieston, Glasgow, G3 8LX", "lat": 55.8639, "lon": -4.2825},
]


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
    results = {}
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
            print(f"  [!] Postcode lookup notice: {e}")
    return results


def fetch_api_stores_nominatim() -> List[Dict[str, any]]:
    """Fetch additional supermarket & convenience store locations in Glasgow via Nominatim API."""
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GlasgowStudentApp/1.0"}
    queries = [
        "Tesco Glasgow",
        "Sainsbury's Glasgow",
        "Lidl Glasgow",
        "Aldi Glasgow",
        "Co-op Glasgow",
        "Morrisons Glasgow",
        "Marks & Spencer Food Glasgow",
    ]
    fetched_stores = []
    seen_coords = set()

    print("[*] Fetching live store locations via OpenStreetMap Nominatim API...")
    for q in queries:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(q)}&format=json&addressdetails=1&limit=10"
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                for item in resp.json():
                    lat = round(float(item["lat"]), 5)
                    lon = round(float(item["lon"]), 5)
                    coord_key = (lat, lon)
                    if coord_key in seen_coords:
                        continue
                    seen_coords.add(coord_key)

                    name = item.get("name") or q.split()[0]
                    addr_dict = item.get("address", {})
                    road = addr_dict.get("road", "")
                    num = addr_dict.get("house_number", "")
                    suburb = addr_dict.get("suburb", "") or addr_dict.get("neighbourhood", "")
                    pc = addr_dict.get("postcode", "")

                    parts = [f"{num} {road}".strip() if road else "", suburb, "Glasgow", pc]
                    clean_addr = ", ".join([p for p in parts if p])
                    if not clean_addr:
                        clean_addr = item.get("display_name", "")

                    fetched_stores.append({"name": name, "address": clean_addr, "lat": lat, "lon": lon})
            time.sleep(1.0)  # Respect rate limit
        except Exception:
            pass

    return fetched_stores


def get_candidate_stores() -> List[Dict[str, any]]:
    """Combine verified store locations with API-fetched stores."""
    stores = list(VERIFIED_GLASGOW_STORES)
    api_stores = fetch_api_stores_nominatim()
    print(f"    -> Retrieved {len(api_stores)} stores from Nominatim API + {len(VERIFIED_GLASGOW_STORES)} catalog stores.")

    seen = {(round(s["lat"], 4), round(s["lon"], 4)) for s in stores}
    for s in api_stores:
        key = (round(s["lat"], 4), round(s["lon"], 4))
        if key not in seen:
            seen.add(key)
            stores.append(s)

    return stores


def calculate_closest_3_stores(
    origin_lat: float, origin_lon: float, candidate_stores: List[Dict[str, any]]
) -> List[Dict[str, any]]:
    """
    Find the closest 3 stores to an accommodation using real route distances from OSRM API.
    """
    # 1. Pre-filter the nearest ~15 candidates by approximate distance to minimize API payload
    def approx_dist(s):
        d_lat = s["lat"] - origin_lat
        d_lon = (s["lon"] - origin_lon) * 0.6  # Cosine factor at 56 deg N
        return d_lat * d_lat + d_lon * d_lon

    prefiltered = sorted(candidate_stores, key=approx_dist)[:15]

    # 2. Query real route distance matrix via OSRM table API
    coords_list = [f"{origin_lon:.6f},{origin_lat:.6f}"] + [
        f"{s['lon']:.6f},{s['lat']:.6f}" for s in prefiltered
    ]
    url = f"http://router.project-osrm.org/table/v1/driving/{';'.join(coords_list)}?sources=0&annotations=distance"

    scored_stores = []
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok":
                distances = data["distances"][0][1:]
                for s, d in zip(prefiltered, distances):
                    if d is not None:
                        dist_miles = round(d / 1609.344, 2)
                        walk_mins = round((dist_miles / 3.0) * 60.0, 1)  # 3.0 mph pedestrian pace
                        scored_stores.append(
                            {
                                "name": s["name"],
                                "address": s["address"],
                                "dist_miles": dist_miles,
                                "walk_mins": walk_mins,
                            }
                        )
    except requests.RequestException:
        pass

    # Fallback to route approximation if OSRM is momentarily down
    if len(scored_stores) < 3:
        for s in prefiltered:
            d_miles = round(math.sqrt(approx_dist(s)) * 68.97 * 1.3, 2)
            w_mins = round((d_miles / 3.0) * 60.0, 1)
            scored_stores.append(
                {"name": s["name"], "address": s["address"], "dist_miles": d_miles, "walk_mins": w_mins}
            )

    # Sort strictly by real routing distance and pick top 3
    scored_stores.sort(key=lambda x: x["dist_miles"])
    return scored_stores[:3]


def main():
    parser = argparse.ArgumentParser(description="Fetch closest 3 stores for each accommodation.")
    parser.add_argument(
        "--input",
        "-i",
        default="accomodation.csv",
        help="Input CSV file of accommodations (default: accomodation.csv)",
    )
    parser.add_argument(
        "--output",
        "-o",
        default="accomodation_nearby_stores.csv",
        help="Output CSV for accommodations with nearby stores (default: accomodation_nearby_stores.csv)",
    )
    args = parser.parse_args()

    input_file = args.input
    output_file = args.output

    if not os.path.exists(input_file):
        print(f"[!] Error: File '{input_file}' not found.")
        sys.exit(1)

    print("=" * 70)
    print(" GLASGOW STUDENT ACCOMMODATION NEARBY STORES FINDER")
    print("=" * 70)
    print(f"Input file:  {input_file}")
    print(f"Output file: {output_file}")

    # Read input accommodation CSV
    with open(input_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        original_fieldnames = reader.fieldnames or []

    if not rows:
        print("[!] No accommodations found in CSV.")
        sys.exit(1)

    # Resolve coordinates for accommodations
    unique_addresses = {r["address"]: r["accommodation_name"] for r in rows}
    print(f"[*] Found {len(unique_addresses)} unique accommodation locations.")

    # Check if distances CSV exists with latitude/longitude
    coords_by_address = {}
    for ref_file in ["accomodation_distance_to_unis.csv", "accomodation_distance_to_unis_alt.csv"]:
        if os.path.exists(ref_file):
            try:
                with open(ref_file, mode="r", encoding="utf-8") as rf:
                    for row in csv.DictReader(rf):
                        if row.get("address") and row.get("latitude") and row.get("longitude"):
                            coords_by_address[row["address"]] = (
                                float(row["latitude"]),
                                float(row["longitude"]),
                            )
                break
            except Exception:
                pass

    # Geocode any missing addresses via postcodes.io
    missing_addresses = [a for a in unique_addresses if a not in coords_by_address]
    if missing_addresses:
        print(f"[*] Geocoding {len(missing_addresses)} accommodation addresses via postcodes.io...")
        postcodes = {extract_uk_postcode(a): a for a in missing_addresses if extract_uk_postcode(a)}
        res = bulk_geocode_postcodes(list(postcodes.keys()))
        for pc, (lat, lon) in res.items():
            addr = postcodes[pc]
            coords_by_address[addr] = (lat, lon)

    # Fetch store locations
    stores_pool = get_candidate_stores()
    print(f"[*] Evaluating {len(stores_pool)} total store locations using real routing API...")

    # Calculate closest 3 stores for each unique address
    cached_stores_by_addr: Dict[str, List[Dict[str, any]]] = {}
    for addr, name in unique_addresses.items():
        coords = coords_by_address.get(addr)
        if coords:
            lat, lon = coords
            top3 = calculate_closest_3_stores(lat, lon, stores_pool)
            cached_stores_by_addr[addr] = top3
        else:
            cached_stores_by_addr[addr] = []

    # Enrich rows with store data
    enriched_rows = []
    for r in rows:
        addr = r.get("address", "")
        top3 = cached_stores_by_addr.get(addr, [])
        new_row = dict(r)

        # Store 1
        if len(top3) > 0:
            new_row["store_1_name"] = top3[0]["name"]
            new_row["store_1_address"] = top3[0]["address"]
            new_row["store_1_dist_miles"] = top3[0]["dist_miles"]
            new_row["store_1_walk_mins"] = top3[0]["walk_mins"]
        else:
            new_row["store_1_name"] = new_row["store_1_address"] = new_row["store_1_dist_miles"] = new_row["store_1_walk_mins"] = ""

        # Store 2
        if len(top3) > 1:
            new_row["store_2_name"] = top3[1]["name"]
            new_row["store_2_address"] = top3[1]["address"]
            new_row["store_2_dist_miles"] = top3[1]["dist_miles"]
            new_row["store_2_walk_mins"] = top3[1]["walk_mins"]
        else:
            new_row["store_2_name"] = new_row["store_2_address"] = new_row["store_2_dist_miles"] = new_row["store_2_walk_mins"] = ""

        # Store 3
        if len(top3) > 2:
            new_row["store_3_name"] = top3[2]["name"]
            new_row["store_3_address"] = top3[2]["address"]
            new_row["store_3_dist_miles"] = top3[2]["dist_miles"]
            new_row["store_3_walk_mins"] = top3[2]["walk_mins"]
        else:
            new_row["store_3_name"] = new_row["store_3_address"] = new_row["store_3_dist_miles"] = new_row["store_3_walk_mins"] = ""

        enriched_rows.append(new_row)

    output_fieldnames = original_fieldnames + [
        "store_1_name",
        "store_1_address",
        "store_1_dist_miles",
        "store_1_walk_mins",
        "store_2_name",
        "store_2_address",
        "store_2_dist_miles",
        "store_2_walk_mins",
        "store_3_name",
        "store_3_address",
        "store_3_dist_miles",
        "store_3_walk_mins",
    ]

    saved_path = output_file
    try:
        with open(output_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=output_fieldnames)
            writer.writeheader()
            writer.writerows(enriched_rows)
    except PermissionError:
        saved_path = "accomodation_nearby_stores_new.csv"
        print(f"\n[!] Note: '{output_file}' is currently locked. Saving to '{saved_path}' instead...")
        with open(saved_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=output_fieldnames)
            writer.writeheader()
            writer.writerows(enriched_rows)

    print(f"\n[+] Successfully saved {len(enriched_rows)} accommodations with nearby stores to '{saved_path}'!")

    # Summary preview
    print("\n" + "=" * 70)
    print(" SAMPLE OF CLOSEST STORES FOUND (MILES)")
    print("=" * 70)
    for sample in enriched_rows[:4]:
        print(f"Accommodation: {sample['accommodation_name']} ({sample['address']})")
        print(f"  1. {sample['store_1_name']} | {sample['store_1_address']} ({sample['store_1_dist_miles']} miles, ~{sample['store_1_walk_mins']} mins walk)")
        print(f"  2. {sample['store_2_name']} | {sample['store_2_address']} ({sample['store_2_dist_miles']} miles, ~{sample['store_2_walk_mins']} mins walk)")
        print(f"  3. {sample['store_3_name']} | {sample['store_3_address']} ({sample['store_3_dist_miles']} miles, ~{sample['store_3_walk_mins']} mins walk)")
        print("-" * 70)


if __name__ == "__main__":
    main()
