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
  const src = variant === "on-green" ? "/brand/club-logo-on-green.jpg" : "/brand/club-logo-on-ivory.jpg";

  return (
    <Image
      src={src}
      alt={alt}
      width={1021}
      height={1021}
      priority={priority}
      sizes="(max-width: 640px) 80px, 112px"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
