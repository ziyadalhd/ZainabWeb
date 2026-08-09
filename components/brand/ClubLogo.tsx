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
  className = "h-auto w-20 sm:w-24",
}: ClubLogoProps) {
  return (
    <Image
      src="/brand/club-logo-on-green.svg"
      alt={alt}
      width={2993}
      height={1844}
      priority={priority}
      sizes="(max-width: 640px) 80px, 112px"
      className={`shrink-0 object-contain ${variant === "on-green" ? "rounded-xl bg-[var(--brand-ivory)] p-2" : ""} ${className}`}
    />
  );
}
