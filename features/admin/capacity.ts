export type CapacityTone = "calm" | "warn" | "full";

const WARN_THRESHOLD = 0.8;

/** Clamps active/capacity to a 0..1 fill ratio. Guards a zero or negative capacity to avoid NaN/Infinity. */
export function capacityRatio(active: number, capacity: number): number {
  if (capacity <= 0) return active > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, active / capacity));
}

export function capacityTone(ratio: number): CapacityTone {
  if (ratio >= 1) return "full";
  if (ratio >= WARN_THRESHOLD) return "warn";
  return "calm";
}
