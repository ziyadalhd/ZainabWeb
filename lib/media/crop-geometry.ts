/**
 * The framing maths behind the poster cropper, kept free of the DOM so it can be reasoned about and
 * tested on its own.
 *
 * The model is one rectangle inside another. The **frame** is the fixed-aspect window the admin
 * looks through; the **image** sits behind it, scaled to cover and shifted by an offset. Everything
 * below is expressed in that frame's own pixel space, so the same numbers drive the CSS preview and
 * the canvas export — the export is the preview, drawn larger.
 */

export type Rotation = 0 | 90 | 180 | 270;

export interface Size {
  width: number;
  height: number;
}

export interface CropTransform {
  /** Zoom multiplier over the cover scale. 1 means "just covers the frame". */
  scale: number;
  /** Frame-space offset of the image's centre from the frame's centre. */
  offsetX: number;
  offsetY: number;
  rotation: Rotation;
}

export const identityTransform: CropTransform = { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;

/** The frame that `aspectRatio` gives for a given width. 0.8 (4:5) is taller than it is wide. */
export function frameSize(width: number, aspectRatio: number): Size {
  return { width, height: width / aspectRatio };
}

/**
 * The image's dimensions as the viewer sees them: a quarter turn swaps width and height, which is
 * why a portrait photo rotated to landscape needs a different cover scale than it did upright.
 */
export function rotatedSize(source: Size, rotation: Rotation): Size {
  return rotation === 90 || rotation === 270 ? { width: source.height, height: source.width } : source;
}

/**
 * The scale at which the image exactly covers the frame — the smallest zoom that leaves no gap.
 *
 * `max` of the two ratios, not `min`: fitting *inside* the frame would letterbox, and a poster with
 * bars baked into the file is worse than one the admin framed deliberately.
 */
export function coverScale(source: Size, frame: Size, rotation: Rotation = 0): number {
  const visible = rotatedSize(source, rotation);
  if (visible.width <= 0 || visible.height <= 0) return 1;
  return Math.max(frame.width / visible.width, frame.height / visible.height);
}

/** The image's on-screen size in frame space at the given transform. */
export function displaySize(source: Size, frame: Size, transform: CropTransform): Size {
  const visible = rotatedSize(source, transform.rotation);
  const scale = coverScale(source, frame, transform.rotation) * transform.scale;
  return { width: visible.width * scale, height: visible.height * scale };
}

export function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return MIN_SCALE;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * Pulls an offset back to the range where the image still covers the frame on every side.
 *
 * At the minimum zoom one axis has no slack at all — a 16:9 photo in a 4:5 frame can slide sideways
 * but not up or down — so that axis clamps to exactly 0 rather than to a negative bound.
 */
export function clampOffset(source: Size, frame: Size, transform: CropTransform): { offsetX: number; offsetY: number } {
  const display = displaySize(source, frame, transform);
  const slackX = Math.max(0, (display.width - frame.width) / 2);
  const slackY = Math.max(0, (display.height - frame.height) / 2);
  const limit = (value: number, slack: number) => (Number.isFinite(value) ? Math.min(slack, Math.max(-slack, value)) : 0);
  return { offsetX: limit(transform.offsetX, slackX), offsetY: limit(transform.offsetY, slackY) };
}

/** Applies both clamps at once — the only way a transform should ever reach state or the canvas. */
export function normalizeTransform(source: Size, frame: Size, transform: CropTransform): CropTransform {
  const scaled = { ...transform, scale: clampScale(transform.scale) };
  return { ...scaled, ...clampOffset(source, frame, scaled) };
}

const TARGET_WIDTH = 1200;
const MINIMUM_WIDTH = 480;

/**
 * How wide to export.
 *
 * Capped at the source pixels actually visible through the frame, so zooming in produces a smaller
 * file rather than an upscaled, softer one — there is no detail there to recover. Capped again at
 * `TARGET_WIDTH`, which is ample for the largest surface a poster appears on.
 */
export function outputWidth(source: Size, frame: Size, transform: CropTransform): number {
  const display = displaySize(source, frame, transform);
  if (display.width <= 0) return MINIMUM_WIDTH;
  const availableSourcePixels = (frame.width / display.width) * rotatedSize(source, transform.rotation).width;
  return Math.max(MINIMUM_WIDTH, Math.min(TARGET_WIDTH, Math.round(availableSourcePixels)));
}
