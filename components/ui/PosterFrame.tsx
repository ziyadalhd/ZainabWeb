import Image from "next/image";

interface PosterFrameProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

export function PosterFrame({ src, alt, sizes, priority = false, className = "" }: PosterFrameProps) {
  const unoptimized = src.startsWith("blob:");
  return (
    <div className={`poster-frame ${className}`.trim()}>
      <Image aria-hidden="true" alt="" src={src} fill sizes={sizes} unoptimized={unoptimized} className="poster-frame__backdrop" />
      <span aria-hidden="true" className="poster-frame__veil" />
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={unoptimized} className="poster-frame__image" />
    </div>
  );
}
