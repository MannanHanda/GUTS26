import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGBP(amount: number, options?: { showDecimal?: boolean }): string {
  const rounded = options?.showDecimal ? amount.toFixed(2) : Math.round(amount).toString();
  return `£${Number(rounded).toLocaleString('en-GB')}`;
}

export function formatCommute(hours: number): string {
  if (hours <= 0) return '0 hrs';
  if (hours < 1) {
    return `${Math.round(hours * 60)} mins/wk`;
  }
  return `${hours} hrs/wk`;
}
