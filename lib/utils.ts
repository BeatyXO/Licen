import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(address?: string) {
  if (!address) return "No wallet";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatGen(value: bigint | number | string) {
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  return `${numeric.toLocaleString(undefined, { maximumFractionDigits: 4 })} GEN`;
}

function toUtcDate(iso: string): Date {
  // Guard against naive datetimes (no Z/offset): JS parses those as local time.
  const s = iso.trim();
  if (s && !s.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(s)) {
    return new Date(s + "Z");
  }
  return new Date(s);
}

export function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const then = toUtcDate(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

export function formatAbsoluteTime(iso: string): string {
  if (!iso) return "";
  const date = toUtcDate(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
