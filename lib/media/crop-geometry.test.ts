import { describe, expect, it } from "vitest";
import {
  MAX_SCALE,
  MIN_SCALE,
  clampOffset,
  clampScale,
  coverScale,
  displaySize,
  frameSize,
  identityTransform,
  normalizeTransform,
  outputWidth,
  rotatedSize,
  type CropTransform,
  type Size,
} from "@/lib/media/crop-geometry";

const POSTER_RATIO = 4 / 5;
const frame = frameSize(320, POSTER_RATIO); // 320 x 400

/** The three shapes an admin actually uploads: a phone photo, a square crop, and a wide banner. */
const sources: Record<string, Size> = {
  vertical: { width: 1080, height: 1920 },
  square: { width: 1000, height: 1000 },
  wide: { width: 1920, height: 1080 },
  panorama: { width: 3000, height: 800 },
};

function at(overrides: Partial<CropTransform> = {}): CropTransform {
  return { ...identityTransform, ...overrides };
}

describe("frameSize", () => {
  it("derives the height from the ratio, so 4:5 is taller than it is wide", () => {
    expect(frame).toEqual({ width: 320, height: 400 });
    expect(frameSize(320, 16 / 9)).toEqual({ width: 320, height: 180 });
  });
});

describe("coverScale", () => {
  it.each(Object.entries(sources))("covers the frame from a %s source with no gap on either axis", (_name, source) => {
    const scale = coverScale(source, frame);
    expect(source.width * scale).toBeGreaterThanOrEqual(frame.width - 0.001);
    expect(source.height * scale).toBeGreaterThanOrEqual(frame.height - 0.001);
  });

  it("binds on the limiting axis: a wide source is sized by the frame's height, a tall one by its width", () => {
    expect(coverScale(sources.wide!, frame)).toBeCloseTo(frame.height / sources.wide!.height, 6);
    expect(coverScale(sources.vertical!, frame)).toBeCloseTo(frame.width / sources.vertical!.width, 6);
  });

  it("recomputes after a quarter turn, when the limiting axis has swapped", () => {
    // Turned on its side, the 16:9 landscape becomes 9:16 and is now bound by the frame's width.
    expect(coverScale(sources.wide!, frame, 90)).toBeCloseTo(frame.width / sources.wide!.height, 6);
  });

  it("does not divide by zero on a source that has not measured yet", () => {
    expect(coverScale({ width: 0, height: 0 }, frame)).toBe(1);
  });
});

describe("displaySize", () => {
  it.each(Object.entries(sources))("keeps the %s source's own proportions — the frame crops, it never stretches", (_name, source) => {
    const display = displaySize(source, frame, at({ scale: 1.7 }));
    expect(display.width / display.height).toBeCloseTo(source.width / source.height, 6);
  });

  it("keeps proportions through a quarter turn, with the axes swapped", () => {
    const display = displaySize(sources.wide!, frame, at({ rotation: 90 }));
    expect(display.width / display.height).toBeCloseTo(sources.wide!.height / sources.wide!.width, 6);
  });

  it("grows with the zoom multiplier", () => {
    const once = displaySize(sources.square!, frame, at());
    const twice = displaySize(sources.square!, frame, at({ scale: 2 }));
    expect(twice.width).toBeCloseTo(once.width * 2, 6);
  });
});

describe("rotatedSize", () => {
  it("swaps the axes on a quarter turn and leaves them alone on a half turn", () => {
    expect(rotatedSize(sources.wide!, 90)).toEqual({ width: 1080, height: 1920 });
    expect(rotatedSize(sources.wide!, 270)).toEqual({ width: 1080, height: 1920 });
    expect(rotatedSize(sources.wide!, 180)).toEqual(sources.wide);
    expect(rotatedSize(sources.wide!, 0)).toEqual(sources.wide);
  });
});

describe("clampScale", () => {
  it("holds the zoom between cover and the maximum, and treats a broken value as cover", () => {
    expect(clampScale(0.2)).toBe(MIN_SCALE);
    expect(clampScale(99)).toBe(MAX_SCALE);
    expect(clampScale(2.5)).toBe(2.5);
    expect(clampScale(Number.NaN)).toBe(MIN_SCALE);
  });
});

describe("clampOffset", () => {
  it("allows a wide source to slide sideways but pins it vertically at the cover scale", () => {
    // At scale 1 a 16:9 source exactly matches the frame's height: no vertical slack exists.
    const clamped = clampOffset(sources.wide!, frame, at({ offsetX: 10_000, offsetY: 10_000 }));
    expect(clamped.offsetY).toBe(0);
    expect(clamped.offsetX).toBeGreaterThan(0);
  });

  it("allows a tall source to slide vertically but pins it horizontally at the cover scale", () => {
    const clamped = clampOffset(sources.vertical!, frame, at({ offsetX: 10_000, offsetY: 10_000 }));
    expect(clamped.offsetX).toBe(0);
    expect(clamped.offsetY).toBeGreaterThan(0);
  });

  it.each(Object.entries(sources))("never lets a %s source's edge pull inside the frame, however far it is dragged", (_name, source) => {
    const transform = at({ scale: 2.3, offsetX: 99_999, offsetY: -99_999 });
    const { offsetX, offsetY } = clampOffset(source, frame, transform);
    const display = displaySize(source, frame, transform);

    // Every frame edge must still land on image: left edge of the image at or past the frame's.
    expect(display.width / 2 + offsetX).toBeGreaterThanOrEqual(frame.width / 2 - 0.001);
    expect(display.width / 2 - offsetX).toBeGreaterThanOrEqual(frame.width / 2 - 0.001);
    expect(display.height / 2 + offsetY).toBeGreaterThanOrEqual(frame.height / 2 - 0.001);
    expect(display.height / 2 - offsetY).toBeGreaterThanOrEqual(frame.height / 2 - 0.001);
  });

  it("gives both axes slack once the admin zooms past cover", () => {
    const clamped = clampOffset(sources.wide!, frame, at({ scale: 2, offsetX: 10_000, offsetY: 10_000 }));
    expect(clamped.offsetX).toBeGreaterThan(0);
    expect(clamped.offsetY).toBeGreaterThan(0);
  });

  it("recovers from a non-finite offset rather than propagating it into the canvas", () => {
    expect(clampOffset(sources.square!, frame, at({ offsetX: Number.NaN }))).toEqual({ offsetX: 0, offsetY: 0 });
  });
});

describe("normalizeTransform", () => {
  it("clamps the zoom first, so an offset is bounded against the scale that will actually apply", () => {
    // Asking for scale 99 with a huge offset: the scale clamps to 4, and the offset must respect
    // the slack at 4, not the slack the requested 99 would have allowed.
    const normalized = normalizeTransform(sources.square!, frame, at({ scale: 99, offsetX: 100_000 }));
    const slackAtMax = (displaySize(sources.square!, frame, at({ scale: MAX_SCALE })).width - frame.width) / 2;
    expect(normalized.scale).toBe(MAX_SCALE);
    expect(normalized.offsetX).toBeCloseTo(slackAtMax, 6);
  });

  it("leaves an already-valid transform untouched", () => {
    const valid = at({ scale: 1.5, offsetX: 4, offsetY: -6, rotation: 180 });
    expect(normalizeTransform(sources.square!, frame, valid)).toEqual(valid);
  });
});

describe("outputWidth", () => {
  it("caps at the target width for a source with pixels to spare", () => {
    expect(outputWidth({ width: 4000, height: 5000 }, frame, at())).toBe(1200);
  });

  it("exports at the source's own width rather than upscaling a smaller image to the target", () => {
    // A 1080-wide phone photo fills the 4:5 frame on its width: 1080 real pixels are all there are,
    // and stretching them to 1200 would only make a larger, softer file.
    expect(outputWidth(sources.vertical!, frame, at())).toBe(1080);
  });

  it("shrinks as the admin zooms in, rather than upscaling pixels that are not there", () => {
    const wide = outputWidth(sources.square!, frame, at());
    const zoomed = outputWidth(sources.square!, frame, at({ scale: 3 }));
    expect(zoomed).toBeLessThan(wide);
  });

  it("never drops below the floor, however far a small source is zoomed", () => {
    expect(outputWidth({ width: 200, height: 200 }, frame, at({ scale: MAX_SCALE }))).toBe(480);
  });

  it("stays finite for a source that has not measured yet", () => {
    expect(outputWidth({ width: 0, height: 0 }, frame, at())).toBe(480);
  });
});
