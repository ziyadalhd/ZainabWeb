import { ClubLogo } from "@/components/brand/ClubLogo";

export function BrandIntersection() {
  return (
    <div className="brand-intersection" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <div className="brand-intersection__logo">
        <ClubLogo alt="" priority className="h-auto w-full" />
      </div>
    </div>
  );
}
