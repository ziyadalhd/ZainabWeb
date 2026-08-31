import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventPosterField } from "@/features/admin/components/EventPosterField";

const cropped = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/crop-image", () => ({ cropImageToFile: cropped }));

URL.createObjectURL = vi.fn(() => "blob:poster");
URL.revokeObjectURL = vi.fn();

function picked(type = "image/png", name = "لقاء.png") {
  return new File(["x"], name, { type });
}

function renderField(overrides: Partial<React.ComponentProps<typeof EventPosterField>> = {}) {
  const onPreviewChange = vi.fn();
  const onPicked = vi.fn();
  render(
    <EventPosterField
      inputId="event-poster"
      label="إضافة بوستر"
      currentPosterUrl={null}
      previewAlt="معاينة بوستر الفعالية"
      onPreviewChange={onPreviewChange}
      onPicked={onPicked}
      {...overrides}
    />,
  );
  return { onPreviewChange, onPicked, input: screen.getByLabelText("إضافة بوستر") as HTMLInputElement };
}

/**
 * Simulates a picker result. `files` must stay writable: the component replaces it with a
 * `DataTransfer` list, and a read-only stub would swallow that write and hide the real behaviour.
 */
function selectFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, "files", { value: [file], configurable: true, writable: true });
  fireEvent.change(input);
}

/** jsdom ships no DataTransfer; this is the minimum the component uses to load a file into an input. */
class StubDataTransfer {
  private readonly added: File[] = [];
  readonly items = { add: (file: File) => this.added.push(file) };
  get files(): File[] {
    return this.added;
  }
}

/** The cropper's own image, not the preview frame's — both are `<img>` elements on this screen. */
function cropperImage() {
  return document.querySelector(".image-cropper__stage img") as HTMLImageElement;
}

async function loadAndApply() {
  const image = cropperImage();
  Object.defineProperty(image, "naturalWidth", { value: 1200, configurable: true });
  Object.defineProperty(image, "naturalHeight", { value: 800, configurable: true });
  fireEvent.load(image);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "اعتماد الصورة" }));
  });
}

beforeEach(() => {
  cropped.mockReset();
  cropped.mockResolvedValue(new File(["y"], "لقاء.webp", { type: "image/webp" }));
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  vi.stubGlobal("DataTransfer", StubDataTransfer);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EventPosterField", () => {
  it("opens the cropper on selection instead of accepting the raw file", () => {
    const { input } = renderField();
    expect(screen.queryByRole("button", { name: "اعتماد الصورة" })).not.toBeInTheDocument();

    selectFile(input, picked());

    expect(screen.getByRole("button", { name: "اعتماد الصورة" })).toBeInTheDocument();
  });

  it("puts the cropped file on the input so the ordinary form submission uploads it", async () => {
    const { input, onPreviewChange, onPicked } = renderField();
    selectFile(input, picked());

    await loadAndApply();

    await waitFor(() => expect(input.files?.[0]?.name).toBe("لقاء.webp"));
    expect(input.files?.[0]?.type).toBe("image/webp");
    expect(input.name).toBe("poster");
    expect(onPreviewChange).toHaveBeenCalledWith("blob:poster");
    expect(onPicked).toHaveBeenCalled();
  });

  it("previews the cropped result, replacing the stored poster", async () => {
    const { input } = renderField({ currentPosterUrl: "https://example.test/old.png" });
    expect(screen.getByText("البوستر الحالي")).toBeInTheDocument();

    selectFile(input, picked());
    await loadAndApply();

    expect(await screen.findByText("معاينة البوستر بعد القصّ")).toBeInTheDocument();
    expect(screen.queryByText("البوستر الحالي")).not.toBeInTheDocument();
  });

  it("clears the selection on cancel rather than submitting an unframed file", () => {
    const { input, onPreviewChange } = renderField();
    selectFile(input, picked());

    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));

    expect(screen.queryByRole("button", { name: "اعتماد الصورة" })).not.toBeInTheDocument();
    expect(input.value).toBe("");
    expect(onPreviewChange).not.toHaveBeenCalled();
  });

  it("re-frames the original image, not the already-cropped one, so each pass is not tighter than the last", async () => {
    const original = picked();
    const { input } = renderField();
    selectFile(input, original);
    await loadAndApply();

    fireEvent.click(await screen.findByRole("button", { name: "إعادة ضبط الإطار" }));

    expect(cropped.mock.calls[0]![0].fileName).toBe("لقاء.png");
    await loadAndApply();
    expect(cropped.mock.calls[1]![0].fileName).toBe("لقاء.png");
  });

  it("keeps the admin's original selection when the browser cannot load a file into an input", async () => {
    vi.stubGlobal("DataTransfer", undefined);
    const { input } = renderField();
    selectFile(input, picked());

    await loadAndApply();

    // The framing is lost, but the poster is not: what the admin picked is still uploadable.
    await waitFor(() => expect(screen.getByText("معاينة البوستر بعد القصّ")).toBeInTheDocument());
    expect(input.files?.[0]?.name).toBe("لقاء.png");
  });

  it("resumes the previous framing when re-opened", async () => {
    const { input } = renderField();
    selectFile(input, picked());

    const image = cropperImage();
    Object.defineProperty(image, "naturalWidth", { value: 1200, configurable: true });
    Object.defineProperty(image, "naturalHeight", { value: 800, configurable: true });
    fireEvent.load(image);
    fireEvent.change(screen.getByLabelText("التكبير"), { target: { value: "2" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "اعتماد الصورة" }));
    });

    fireEvent.click(await screen.findByRole("button", { name: "إعادة ضبط الإطار" }));

    expect(screen.getByLabelText("التكبير")).toHaveValue("2");
  });

  it.each([
    ["JPG", "image/jpeg", "لقاء.jpg"],
    ["PNG", "image/png", "لقاء.png"],
    ["WebP", "image/webp", "لقاء.webp"],
  ])("takes a %s selection all the way from picker to a cropped file on the input", async (_label, type, name) => {
    const { input, onPreviewChange } = renderField();

    selectFile(input, picked(type, name));
    // The image is live in the frame, not a broken placeholder: it carries the object URL and
    // measures, which is what unlocks the confirm button.
    const image = cropperImage();
    expect(image.src).toBe("blob:poster");
    await loadAndApply();

    expect(cropped).toHaveBeenCalledWith(expect.objectContaining({ fileName: name, source: { width: 1200, height: 800 } }));
    await waitFor(() => expect(input.files?.[0]?.name).toBe("لقاء.webp"));
    expect(onPreviewChange).toHaveBeenCalledWith("blob:poster");
  });
});
