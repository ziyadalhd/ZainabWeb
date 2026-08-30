import { capacityRatio, capacityTone } from "@/features/admin/capacity";
import { formatCapacityRatio } from "@/lib/format/date";

export function CapacityMeter({ active, capacity }: { active: number; capacity: number }) {
  const ratio = capacityRatio(active, capacity);
  const tone = capacityTone(ratio);
  const label = formatCapacityRatio(active, capacity);
  return (
    <div className="event-card__capacity">
      <div className="capacity-meter" role="img" aria-label={label}>
        <div
          className={`capacity-meter__fill${tone === "warn" ? " capacity-meter__fill--warn" : ""}${tone === "full" ? " capacity-meter__fill--full" : ""}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <span className="event-card__capacity-label numeral" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}
