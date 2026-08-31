import { coverScale, frameSize, outputWidth, type CropTransform, type Size } from "@/lib/media/crop-geometry";

/** WebP first: it is meaningfully smaller than JPEG at the same quality and the poster storage accepts both. */
const OUTPUT_FORMATS = [
  { mimeType: "image/webp", extension: "webp" },
  { mimeType: "image/jpeg", extension: "jpg" },
] as const;

const QUALITY = 0.85;

function toBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, QUALITY));
}

/** Strips the original extension so a cropped PNG is not saved under a name claiming it is one. */
function renameTo(originalName: string, extension: string): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "poster";
  return `${base}.${extension}`;
}

export interface CropRequest {
  image: CanvasImageSource;
  /**
   * The image's intrinsic pixel dimensions. Passed explicitly because an `HTMLImageElement`'s
   * `width`/`height` report its laid-out size, which for a preview scaled into a small frame is not
   * the resolution the crop must be computed from.
   */
  source: Size;
  transform: CropTransform;
  aspectRatio: number;
  /** The frame width the transform was authored against — its offsets are in this space. */
  frameWidth: number;
  fileName: string;
}

/**
 * Renders the framed region of an image to a new, optimised `File`.
 *
 * The canvas is the frame, scaled up: the same centre, offset, and rotation the admin arranged in
 * the preview, multiplied by `pixelsPerFrameUnit`. Drawing rotated about the canvas centre — rather
 * than computing a source rectangle — is what keeps a quarter-turned image square with the frame
 * instead of skewed, and it is one code path for all four rotations.
 *
 * The result always fills the frame exactly, so no transparent margin can survive into the file and
 * no aspect ratio is stretched to fit: a wide photo in a tall frame loses its sides, it is never
 * squeezed.
 */
export async function cropImageToFile({ image, source, transform, aspectRatio, frameWidth, fileName }: CropRequest): Promise<File> {
  const frame = frameSize(frameWidth, aspectRatio);
  const width = outputWidth(source, frame, transform);
  const height = Math.round(width / aspectRatio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");

  const pixelsPerFrameUnit = width / frame.width;
  const drawScale = coverScale(source, frame, transform.rotation) * transform.scale * pixelsPerFrameUnit;

  context.imageSmoothingQuality = "high";
  context.translate(width / 2 + transform.offsetX * pixelsPerFrameUnit, height / 2 + transform.offsetY * pixelsPerFrameUnit);
  context.rotate((transform.rotation * Math.PI) / 180);
  context.drawImage(image, (-source.width * drawScale) / 2, (-source.height * drawScale) / 2, source.width * drawScale, source.height * drawScale);

  for (const format of OUTPUT_FORMATS) {
    const blob = await toBlob(canvas, format.mimeType);
    // A browser that cannot encode the requested type silently hands back a PNG, so the type is
    // checked rather than trusted; only an exact match ends the search.
    if (blob && blob.type === format.mimeType) {
      return new File([blob], renameTo(fileName, format.extension), { type: format.mimeType });
    }
  }
  throw new Error("Unable to encode the cropped image");
}
