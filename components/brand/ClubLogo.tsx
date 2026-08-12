import Image from "next/image";

interface ClubLogoProps {
  variant?: "on-ivory" | "on-green";
  alt?: string;
  priority?: boolean;
  className?: string;
}

export function ClubLogo({
  variant = "on-ivory",
  alt = "شعار نادي بَيْن الثقافي",
  priority = false,
  className = "h-auto w-28 sm:w-36",
}: ClubLogoProps) {
  return (
    <Image
      src="/brand/club-logo-on-green.svg"
      alt={alt}
      width={2993}
      height={1844}
      priority={priority}
      sizes="(max-width: 640px) 112px, 144px"
      className={`shrink-0 object-contain ${variant === "on-green" ? "rounded-sm bg-[var(--brand-ivory)] p-2" : ""} ${className}`}
    />
  );
}
