import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cropImageToFile } from "@/lib/media/crop-image";
import { coverScale, frameSize, identityTransform, type CropTransform, type Size } from "@/lib/media/crop-geometry";

const POSTER_RATIO = 4 / 5;
const FRAME_WIDTH = 320;
const frame = frameSize(FRAME_WIDTH, POSTER_RATIO);

interface DrawCall {
  args: number[];
}

/**
 * jsdom has no canvas backend, so `getContext`/`toBlob` are stubbed with recorders. What is under
 * test here is the transform arithmetic — the translate, rotate, and draw the helper issues — not
 * the browser's rasteriser.
 */
function stubCanvas(options: { encodes?: readonly string[] } = {}) {
  const encodes = options.encodes ?? ["image/webp"];
  const calls = { translate: [] as number[][], rotate: [] as number[], draw: [] as DrawCall[] };
  const context = {
    imageSmoothingQuality: "low",
    translate: (...args: number[]) => calls.translate.push(args),
    rotate: (angle: number) => calls.rotate.push(angle),
    drawImage: (_image: unknown, ...args: number[]) => calls.draw.push({ args }),
  };
  const canvas = { width: 0, height: 0 } as HTMLCanvasElement & { width: number; height: number };
  Object.assign(canvas, {
    getContext: () => context as unknown as CanvasRenderingContext2D,
    toBlob: (callback: BlobCallback, mimeType: string) => {
      // A browser that cannot encode the requested type hands back a PNG instead of failing.
      const type = encodes.includes(mimeType) ? mimeType : "image/png";
      callback(new Blob(["x"], { type }));
    },
  });
  vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLElement);
  return { canvas, calls, context };
}

function image(source: Size) {
  return { width: source.width, height: source.height } as unknown as CanvasImageSource;
}

function crop(source: Size, transform: Partial<CropTransform> = {}, fileName = "لقاء.png") {
  return cropImageToFile({
    image: image(source),
    source,
    transform: { ...identityTransform, ...transform },
    aspectRatio: POSTER_RATIO,
    frameWidth: FRAME_WIDTH,
    fileName,
  });
}

describe("cropImageToFile", () => {
  beforeEach(() => {
    vi.stubGlobal("Blob", Blob);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sizes the canvas to the requested aspect ratio, whatever shape the source is", async () => {
    for (const source of [
      { width: 1080, height: 1920 },
      { width: 1000, height: 1000 },
      { width: 1920, height: 1080 },
      { width: 3000, height: 800 },
    ]) {
      const { canvas } = stubCanvas();
      await crop(source);
      expect(canvas.width / canvas.height).toBeCloseTo(POSTER_RATIO, 2);
      vi.restoreAllMocks();
    }
  });

  it("draws the source at its own proportions — a wide photo loses its sides, it is never squeezed", async () => {
    const source = { width: 1920, height: 1080 };
    const { calls } = stubCanvas();

    await crop(source);

    const [, , drawnWidth, drawnHeight] = calls.draw[0]!.args;
    expect(drawnWidth! / drawnHeight!).toBeCloseTo(source.width / source.height, 6);
  });

  it("draws large enough to cover the canvas, leaving no transparent margin in the file", async () => {
    const source = { width: 3000, height: 800 };
    const { canvas, calls } = stubCanvas();

    await crop(source);

    const [, , drawnWidth, drawnHeight] = calls.draw[0]!.args;
    expect(drawnWidth).toBeGreaterThanOrEqual(canvas.width - 0.001);
    expect(drawnHeight).toBeGreaterThanOrEqual(canvas.height - 0.001);
  });

  it("centres the draw on the canvas, then shifts it by the offset scaled into output pixels", async () => {
    const source = { width: 1000, height: 1000 };
    const { canvas, calls } = stubCanvas();

    await crop(source, { scale: 2, offsetX: 20, offsetY: -12 });

    const pixelsPerFrameUnit = canvas.width / frame.width;
    expect(calls.translate[0]![0]).toBeCloseTo(canvas.width / 2 + 20 * pixelsPerFrameUnit, 6);
    expect(calls.translate[0]![1]).toBeCloseTo(canvas.height / 2 - 12 * pixelsPerFrameUnit, 6);
  });

  it("scales the draw by the cover scale times the zoom, so the preview and the export agree", async () => {
    const source = { width: 1000, height: 1000 };
    const { canvas, calls } = stubCanvas();

    await crop(source, { scale: 1.5 });

    const expected = coverScale(source, frame) * 1.5 * (canvas.width / frame.width) * source.width;
    expect(calls.draw[0]!.args[2]).toBeCloseTo(expected, 6);
  });

  it("rotates about the canvas centre and covers the frame from the turned orientation", async () => {
    const source = { width: 1920, height: 1080 };
    const { canvas, calls } = stubCanvas();

    await crop(source, { rotation: 90 });

    expect(calls.rotate[0]).toBeCloseTo(Math.PI / 2, 6);
    // Turned on its side the image is 1080 wide by 1920 tall, so its drawn *height* must now span
    // the canvas width — the axis the quarter turn moved it onto.
    const [, , drawnWidth, drawnHeight] = calls.draw[0]!.args;
    expect(drawnHeight).toBeGreaterThanOrEqual(canvas.width - 0.001);
    expect(drawnWidth).toBeGreaterThanOrEqual(canvas.height - 0.001);
  });

  it("prefers WebP and renames the file to match what it actually encoded", async () => {
    stubCanvas({ encodes: ["image/webp"] });

    const file = await crop({ width: 1000, height: 1000 });

    expect(file.type).toBe("image/webp");
    expect(file.name).toBe("لقاء.webp");
  });

  it("falls back to JPEG when the browser cannot encode WebP, rather than storing a mislabelled PNG", async () => {
    stubCanvas({ encodes: ["image/jpeg"] });

    const file = await crop({ width: 1000, height: 1000 });

    expect(file.type).toBe("image/jpeg");
    expect(file.name).toBe("لقاء.jpg");
  });

  it("names an extensionless file rather than producing a bare extension", async () => {
    stubCanvas();
    const file = await crop({ width: 1000, height: 1000 }, {}, "poster");
    expect(file.name).toBe("poster.webp");
  });

  it("rejects when no supported format can be encoded, instead of returning an unusable file", async () => {
    stubCanvas({ encodes: [] });
    await expect(crop({ width: 1000, height: 1000 })).rejects.toThrow(/encode/i);
  });
});
