import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { coverScale, frameSize } from "@/lib/media/crop-geometry";

const cropped = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/crop-image", () => ({ cropImageToFile: cropped }));

const POSTER_RATIO = 4 / 5;
const FRAME_WIDTH = 320;
const frame = frameSize(FRAME_WIDTH, POSTER_RATIO);

function sourceFile(type = "image/png", name = "لقاء.png") {
  return new File(["x"], name, { type });
}

function croppedImage() {
  return document.querySelector(".image-cropper__stage img") as HTMLImageElement;
}

function renderCropper(overrides: Partial<React.ComponentProps<typeof ImageCropper>> = {}) {
  const onApply = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <ImageCropper file={sourceFile()} aspectRatio={POSTER_RATIO} title="ضبط إطار البوستر" onApply={onApply} onCancel={onCancel} {...overrides} />,
  );
  return { onApply, onCancel, ...view };
}

/** jsdom reports 0 for natural dimensions, so a loaded image of a given size has to be simulated. */
function loadImage(width: number, height: number) {
  const image = document.querySelector("img")!;
  Object.defineProperty(image, "naturalWidth", { value: width, configurable: true });
  Object.defineProperty(image, "naturalHeight", { value: height, configurable: true });
  fireEvent.load(image);
  return image;
}

function stage() {
  return document.querySelector(".image-cropper__stage") as HTMLElement;
}

function drag(fromX: number, fromY: number, toX: number, toY: number) {
  const surface = screen.getByRole("application", { name: "إطار قصّ البوستر" });
  fireEvent.pointerDown(surface, { pointerId: 1, clientX: fromX, clientY: fromY });
  fireEvent.pointerMove(surface, { pointerId: 1, clientX: toX, clientY: toY });
  fireEvent.pointerUp(surface, { pointerId: 1 });
}

// The <dialog> polyfill lives in vitest.setup.ts; only pointer capture and object URLs, which jsdom
// also lacks, are stubbed here.
// jsdom implements neither, and the component's cleanup runs after this file's own afterEach, so
// these stay stubbed for the file's lifetime rather than being restored to `undefined`.
URL.createObjectURL = vi.fn(() => "blob:poster");
URL.revokeObjectURL = vi.fn();

beforeEach(() => {
  cropped.mockReset();
  cropped.mockResolvedValue(new File(["y"], "لقاء.webp", { type: "image/webp" }));
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
});

describe("ImageCropper", () => {
  it("sizes the frame to the requested ratio and offers the Arabic confirm and cancel actions", () => {
    renderCropper();
    const surface = screen.getByRole("application", { name: "إطار قصّ البوستر" });

    expect(surface).toHaveStyle({ width: "320px", height: "400px" });
    expect(screen.getByRole("button", { name: "اعتماد الصورة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إلغاء" })).toBeInTheDocument();
  });

  it.each([
    ["vertical", 1080, 1920],
    ["square", 1000, 1000],
    ["wide landscape", 1920, 1080],
  ])("covers the frame from a %s source without distorting it", (_name, width, height) => {
    renderCropper();
    loadImage(width, height);

    const rendered = stage();
    const renderedWidth = Number.parseFloat(rendered.style.width);
    const renderedHeight = Number.parseFloat(rendered.style.height);

    expect(renderedWidth / renderedHeight).toBeCloseTo(width / height, 4);
    expect(renderedWidth).toBeGreaterThanOrEqual(frame.width - 0.001);
    expect(renderedHeight).toBeGreaterThanOrEqual(frame.height - 0.001);
  });

  it("pans by the pointer delta and clamps at the edge rather than exposing a gap", () => {
    renderCropper();
    loadImage(1920, 1080); // wide: horizontal slack only

    drag(100, 100, 130, 100);
    expect(stage().style.transform).toContain("translate(30px, 0px)");

    // Far past the edge: the offset stops at the slack instead of following the pointer.
    drag(100, 100, 9999, 100);
    const slack = (1920 * coverScale({ width: 1920, height: 1080 }, frame) - frame.width) / 2;
    expect(stage().style.transform).toContain(`translate(${slack}px, 0px)`);
  });

  it("gives a wide source no vertical travel at the cover scale", () => {
    renderCropper();
    loadImage(1920, 1080);

    drag(100, 100, 100, 400);

    expect(stage().style.transform).toContain("translate(0px, 0px)");
  });

  it("zooms from the slider and from the mouse wheel", () => {
    renderCropper();
    loadImage(1000, 1000);
    const baseWidth = Number.parseFloat(stage().style.width);

    fireEvent.change(screen.getByLabelText("التكبير"), { target: { value: "2" } });
    expect(Number.parseFloat(stage().style.width)).toBeCloseTo(baseWidth * 2, 3);

    fireEvent.wheel(screen.getByRole("application", { name: "إطار قصّ البوستر" }), { deltaY: -200 });
    expect(Number.parseFloat(stage().style.width)).toBeGreaterThan(baseWidth * 2);
  });

  it("does not let the zoom fall below the scale that covers the frame", () => {
    renderCropper();
    loadImage(1000, 1000);

    fireEvent.wheel(screen.getByRole("application", { name: "إطار قصّ البوستر" }), { deltaY: 5000 });

    expect(Number.parseFloat(stage().style.width)).toBeGreaterThanOrEqual(frame.width - 0.001);
    expect(Number.parseFloat(stage().style.height)).toBeGreaterThanOrEqual(frame.height - 0.001);
  });

  it("turns the image a quarter at a time and re-covers the frame in the new orientation", () => {
    renderCropper();
    loadImage(1920, 1080);

    fireEvent.click(screen.getByRole("button", { name: "تدوير ٩٠°" }));

    expect(document.querySelector("img")!.style.transform).toContain("rotate(90deg)");
    const rendered = stage();
    expect(Number.parseFloat(rendered.style.width)).toBeGreaterThanOrEqual(frame.width - 0.001);
    expect(Number.parseFloat(rendered.style.height)).toBeGreaterThanOrEqual(frame.height - 0.001);
  });

  it("returns to the untouched framing on reset", () => {
    renderCropper();
    loadImage(1000, 1000);
    const baseTransform = stage().style.transform;

    fireEvent.change(screen.getByLabelText("التكبير"), { target: { value: "3" } });
    drag(100, 100, 160, 140);
    expect(stage().style.transform).not.toBe(baseTransform);

    fireEvent.click(screen.getByRole("button", { name: "إعادة الضبط" }));
    expect(stage().style.transform).toBe(baseTransform);
  });

  it("exports the arranged framing and hands the file back", async () => {
    const { onApply } = renderCropper();
    loadImage(1000, 1000);

    fireEvent.change(screen.getByLabelText("التكبير"), { target: { value: "2" } });
    drag(100, 100, 120, 100);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "اعتماد الصورة" }));
    });

    expect(cropped).toHaveBeenCalledWith(
      expect.objectContaining({
        source: { width: 1000, height: 1000 },
        aspectRatio: POSTER_RATIO,
        frameWidth: FRAME_WIDTH,
        fileName: "لقاء.png",
        transform: expect.objectContaining({ scale: 2, offsetX: 20, offsetY: 0, rotation: 0 }),
      }),
    );
    await waitFor(() => expect(onApply).toHaveBeenCalledWith(expect.any(File)));
  });

  it("resumes from a previous framing so re-adjusting does not start over", () => {
    renderCropper({ initialTransform: { scale: 2.5, offsetX: 12, offsetY: -8, rotation: 180 } });
    loadImage(1000, 1000);

    expect(screen.getByLabelText("التكبير")).toHaveValue("2.5");
    expect(stage().style.transform).toContain("translate(12px, -8px)");
    expect(document.querySelector("img")!.style.transform).toContain("rotate(180deg)");
  });

  it("reports a failed export and stays open rather than closing on a file that was never produced", async () => {
    cropped.mockRejectedValue(new Error("no canvas"));
    const { onApply } = renderCropper();
    loadImage(1000, 1000);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "اعتماد الصورة" }));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("تعذر تجهيز الصورة");
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "اعتماد الصورة" })).toBeEnabled();
  });

  it("cancels without exporting", () => {
    const { onCancel, onApply } = renderCropper();
    loadImage(1000, 1000);

    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));

    expect(onCancel).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
    expect(cropped).not.toHaveBeenCalled();
  });

  it("keeps the controls inert until the image has measured", () => {
    renderCropper();
    expect(screen.getByRole("button", { name: "اعتماد الصورة" })).toBeDisabled();
    expect(screen.getByLabelText("التكبير")).toBeDisabled();
  });
});

describe("ImageCropper — image source lifecycle", () => {
  it("keeps the image pointed at a live object URL through React's strict-mode double mount", () => {
    // Regression: the URL used to be created once during render and cached in state, while the
    // revoke lived in an effect cleanup. Strict mode tears effects down and mounts them again, so
    // the cached URL was revoked and never replaced — every development run showed a broken image.
    let minted = 0;
    const revoked: string[] = [];
    URL.createObjectURL = vi.fn(() => `blob:poster-${++minted}`);
    URL.revokeObjectURL = vi.fn((url: string) => void revoked.push(url));

    render(
      <StrictMode>
        <ImageCropper file={sourceFile()} aspectRatio={POSTER_RATIO} title="ضبط إطار البوستر" onApply={vi.fn()} onCancel={vi.fn()} />
      </StrictMode>,
    );

    expect(revoked).not.toContain(croppedImage().src);
    expect(croppedImage().src).toBe("blob:poster-2");
  });

  it("assigns the object URL to the image itself", () => {
    URL.createObjectURL = vi.fn(() => "blob:poster");
    renderCropper();
    expect(croppedImage().src).toBe("blob:poster");
  });

  it("revokes the URL only on unmount, not on a re-render", () => {
    URL.createObjectURL = vi.fn(() => "blob:poster");
    const revoke = vi.fn();
    URL.revokeObjectURL = revoke;

    // The same File instance throughout: a re-render is not a new selection, and must not release
    // the URL the image is currently displaying.
    const file = sourceFile();
    const { rerender, unmount } = renderCropper({ file });
    loadImage(1000, 1000);
    fireEvent.change(screen.getByLabelText("التكبير"), { target: { value: "2" } });
    rerender(<ImageCropper file={file} aspectRatio={POSTER_RATIO} title="ضبط إطار البوستر" onApply={vi.fn()} onCancel={vi.fn()} />);
    expect(revoke).not.toHaveBeenCalled();

    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:poster");
  });

  it("swaps to a fresh URL and releases the old one when a different file is supplied", () => {
    let minted = 0;
    URL.createObjectURL = vi.fn(() => `blob:poster-${++minted}`);
    const revoke = vi.fn();
    URL.revokeObjectURL = revoke;

    const { rerender } = renderCropper();
    expect(croppedImage().src).toBe("blob:poster-1");

    rerender(
      <ImageCropper file={sourceFile("image/webp", "أخرى.webp")} aspectRatio={POSTER_RATIO} title="ضبط إطار البوستر" onApply={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(revoke).toHaveBeenCalledWith("blob:poster-1");
    expect(croppedImage().src).toBe("blob:poster-2");
  });

  it.each([
    ["JPG", "image/jpeg", "لقاء.jpg"],
    ["PNG", "image/png", "لقاء.png"],
    ["WebP", "image/webp", "لقاء.webp"],
  ])("renders a %s selection and measures it for framing", (_label, type, name) => {
    URL.createObjectURL = vi.fn(() => "blob:poster");
    renderCropper({ file: sourceFile(type, name) });

    expect(croppedImage().src).toBe("blob:poster");
    loadImage(1600, 900);

    expect(Number.parseFloat(stage().style.width)).toBeGreaterThanOrEqual(frame.width - 0.001);
    expect(screen.getByRole("button", { name: "اعتماد الصورة" })).toBeEnabled();
  });
});

describe("ImageCropper — load failures", () => {
  it("retries through a data URL when the object URL will not load", async () => {
    renderCropper();
    const image = croppedImage();

    fireEvent.error(image);

    await waitFor(() => expect(image.src).toMatch(/^data:/));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("reports the failure instead of sitting on a placeholder when the retry fails too", async () => {
    renderCropper();
    const image = croppedImage();

    fireEvent.error(image);
    await waitFor(() => expect(image.src).toMatch(/^data:/));
    fireEvent.error(image);

    expect(await screen.findByRole("alert")).toHaveTextContent("تعذر عرض هذه الصورة");
    expect(screen.getByRole("button", { name: "اعتماد الصورة" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "إلغاء" })).toBeEnabled();
  });

  it("treats a decoded but empty image as a failure rather than framing a zero-sized source", () => {
    renderCropper();
    loadImage(0, 0);

    expect(screen.getByRole("alert")).toHaveTextContent("تعذر عرض هذه الصورة");
    expect(screen.getByRole("button", { name: "اعتماد الصورة" })).toBeDisabled();
  });

  it("clears a previous load error once an image measures successfully", async () => {
    renderCropper();
    const image = croppedImage();
    fireEvent.error(image);
    await waitFor(() => expect(image.src).toMatch(/^data:/));
    fireEvent.error(image);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    loadImage(1000, 1000);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "اعتماد الصورة" })).toBeEnabled();
  });
});
