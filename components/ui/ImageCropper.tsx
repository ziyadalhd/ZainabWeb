"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cropImageToFile } from "@/lib/media/crop-image";
import {
  MAX_SCALE,
  MIN_SCALE,
  clampScale,
  displaySize,
  frameSize,
  identityTransform,
  normalizeTransform,
  type CropTransform,
  type Rotation,
  type Size,
} from "@/lib/media/crop-geometry";

/** The frame's width in its own coordinate space. Offsets and the CSS preview share these units. */
const FRAME_WIDTH = 320;
const WHEEL_SENSITIVITY = 0.0015;

interface ImageCropperProps {
  file: File;
  /** Width divided by height. 0.8 is the 4:5 the poster surfaces are built around. */
  aspectRatio: number;
  title: string;
  onCancel: () => void;
  onApply: (cropped: File) => void;
  /** Restores a previous framing so re-opening the cropper resumes where the admin left off. */
  initialTransform?: CropTransform;
  onTransformChange?: (transform: CropTransform) => void;
}

/**
 * A framing tool for poster uploads: pan, zoom, and quarter-turn an image inside the fixed aspect
 * the event surfaces use, then export exactly what the frame shows.
 *
 * The frame is authoritative. The image is scaled to *cover* it and its offset is clamped so no
 * edge can pull inside, which means a source of any shape — tall phone photo, square crop, wide
 * landscape — produces the same undistorted output rectangle. Nothing is ever stretched to fit;
 * whatever does not fit is cropped away, and the admin chooses which part that is.
 *
 * Interaction happens on a CSS transform rather than a canvas, so dragging stays smooth on a large
 * image; the canvas runs once, on apply, from the same numbers.
 */
export function ImageCropper({ file, aspectRatio, title, onCancel, onApply, initialTransform, onTransformChange }: ImageCropperProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragOrigin = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const headingId = useId();
  const sliderId = useId();

  const [source, setSource] = useState<Size | null>(null);
  const [transform, setTransform] = useState<CropTransform>(initialTransform ?? identityTransform);
  const [applying, setApplying] = useState(false);
  const [failed, setFailed] = useState<"load" | "export" | null>(null);
  /** Guards the data-URL retry so a second failure reports rather than looping. */
  const triedDataUrl = useRef(false);

  const frame = frameSize(FRAME_WIDTH, aspectRatio);

  /**
   * Points the image at the picked file, and revokes that URL when the file changes or the cropper
   * closes — never in between.
   *
   * The URL is created *here*, in an effect keyed on the file, rather than cached in state. State
   * outlives an effect's cleanup: React Strict Mode mounts effects, tears them down, and mounts them
   * again, so a URL created once during render and revoked by that teardown left the `<img>`
   * pointing at a dead blob for the rest of the component's life — a broken-image placeholder in
   * every development run. Re-running this effect mints a fresh URL, which is what makes the
   * teardown safe.
   *
   * `src` is assigned imperatively so it lands *after* commit, by which point React has already
   * attached the `load` and `error` handlers below — the decode can never finish before something
   * is listening for it.
   */
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    triedDataUrl.current = false;
    const url = URL.createObjectURL(file);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  // `cancel` covers Escape and the backdrop's own dismissal, so one handler answers every route out
  // that is not the explicit button.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (domEvent: Event) => {
      domEvent.preventDefault();
      onCancel();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onCancel]);

  const update = useCallback(
    (next: CropTransform) => {
      if (!source) return;
      const normalized = normalizeTransform(source, frame, next);
      setTransform(normalized);
      onTransformChange?.(normalized);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `frame` is derived from the constant width and the ratio prop
    [source, aspectRatio, onTransformChange],
  );

  /**
   * Everything that depends on the image's real dimensions — the cover scale, the offset bounds, the
   * stage size behind the grid — is derived here and nowhere else, because before this fires
   * `naturalWidth` is 0 and every one of those numbers would be nonsense.
   */
  function onImageLoad() {
    const image = imageRef.current;
    if (!image) return;
    // A decoded-but-empty image is a failed load wearing a success event; treating it as a real
    // size would leave a zero-width stage that looks like a bug in the framing, not the file.
    if (image.naturalWidth < 1 || image.naturalHeight < 1) {
      setFailed("load");
      return;
    }
    const loaded = { width: image.naturalWidth, height: image.naturalHeight };
    setSource(loaded);
    setTransform((current) => normalizeTransform(loaded, frame, current));
    setFailed(null);
  }

  /**
   * Falls back to a data URL once before giving up.
   *
   * An object URL is the cheap path but not the only one: a browser that has already released the
   * blob, or a context where object URLs are unavailable, still reads the same bytes through
   * `FileReader`. If that fails too the cropper says so and stays usable — cancellable, with the
   * confirm button inert — rather than sitting on a placeholder that never resolves.
   */
  function onImageError() {
    const image = imageRef.current;
    if (!image || triedDataUrl.current) {
      setFailed("load");
      return;
    }
    triedDataUrl.current = true;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") image.src = reader.result;
      else setFailed("load");
    };
    reader.onerror = () => setFailed("load");
    reader.readAsDataURL(file);
  }

  function onPointerDown(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    if (!source) return;
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    dragOrigin.current = {
      pointerId: pointerEvent.pointerId,
      x: pointerEvent.clientX,
      y: pointerEvent.clientY,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY,
    };
  }

  function onPointerMove(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    const origin = dragOrigin.current;
    if (!origin || origin.pointerId !== pointerEvent.pointerId) return;
    // The frame renders at its own width in CSS pixels, so screen deltas are frame deltas.
    update({ ...transform, offsetX: origin.offsetX + (pointerEvent.clientX - origin.x), offsetY: origin.offsetY + (pointerEvent.clientY - origin.y) });
  }

  function endDrag(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    if (dragOrigin.current?.pointerId !== pointerEvent.pointerId) return;
    dragOrigin.current = null;
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
  }

  function onWheel(wheelEvent: React.WheelEvent<HTMLDivElement>) {
    if (!source) return;
    update({ ...transform, scale: clampScale(transform.scale * (1 - wheelEvent.deltaY * WHEEL_SENSITIVITY)) });
  }

  function rotate() {
    if (!source) return;
    // A quarter turn changes which axis has slack, so the offsets turn with the image and are then
    // re-clamped against the new cover scale rather than being kept and quietly going out of range.
    update({ ...transform, rotation: ((transform.rotation + 90) % 360) as Rotation, offsetX: -transform.offsetY, offsetY: transform.offsetX });
  }

  async function apply() {
    const image = imageRef.current;
    if (!image || !source || applying) return;
    setApplying(true);
    setFailed(null);
    try {
      onApply(await cropImageToFile({ image, source, transform, aspectRatio, frameWidth: FRAME_WIDTH, fileName: file.name }));
    } catch {
      setFailed("export");
      setApplying(false);
    }
  }

  const display = source ? displaySize(source, frame, transform) : frame;
  const quarterTurned = transform.rotation === 90 || transform.rotation === 270;

  return (
    <dialog ref={dialogRef} className="image-cropper" aria-labelledby={headingId}>
      <div className="image-cropper__body">
        <div>
          <h2 id={headingId} className="text-lg font-bold text-[var(--brand-forest)]">
            {title}
          </h2>
          <p className="mt-1 text-sm muted-copy">اسحبي الصورة لتحديد موضعها، وكبّريها حتى تملأ الإطار كما تريدين.</p>
        </div>

        <div
          className="image-cropper__frame"
          style={{ width: `${frame.width}px`, height: `${frame.height}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          role="application"
          aria-label="إطار قصّ البوستر"
        >
          <div
            className="image-cropper__stage"
            // Physical width/height and a physical translate: `transform` is not
            // direction-aware, so mixing logical properties in here would flip the drag under RTL.
            style={{
              width: `${display.width}px`,
              height: `${display.height}px`,
              transform: `translate(-50%, -50%) translate(${transform.offsetX}px, ${transform.offsetY}px)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL measured by its natural size; next/image would resize and re-encode the very pixels being cropped */}
            <img
              ref={imageRef}
              alt=""
              onLoad={onImageLoad}
              onError={onImageError}
              draggable={false}
              className="image-cropper__image"
              style={{
                width: `${quarterTurned ? display.height : display.width}px`,
                height: `${quarterTurned ? display.width : display.height}px`,
                transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
              }}
            />
          </div>
          <span className="image-cropper__grid" aria-hidden="true" />
        </div>

        <div className="image-cropper__controls">
          <label className="image-cropper__zoom" htmlFor={sliderId}>
            <span>التكبير</span>
            <input
              id={sliderId}
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.01}
              value={transform.scale}
              disabled={!source}
              onChange={(changeEvent) => update({ ...transform, scale: Number(changeEvent.target.value) })}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="button-quiet min-h-10 px-3 py-2 text-sm" onClick={rotate} disabled={!source}>
              تدوير ٩٠°
            </button>
            <button type="button" className="button-quiet min-h-10 px-3 py-2 text-sm" onClick={() => update(identityTransform)} disabled={!source}>
              إعادة الضبط
            </button>
          </div>
        </div>

        {failed ? (
          <p role="alert" className="notice-error">
            {failed === "load"
              ? "تعذر عرض هذه الصورة. تأكدي أنها PNG أو JPG أو WebP سليمة، أو اختاري صورة أخرى."
              : "تعذر تجهيز الصورة. حاولي مرة أخرى أو اختاري صورة أخرى."}
          </p>
        ) : null}

        <div className="image-cropper__actions">
          <button type="button" className="button-primary min-h-11 px-5 py-2.5" onClick={apply} disabled={!source || applying}>
            {applying ? "جارٍ التجهيز…" : "اعتماد الصورة"}
          </button>
          <button type="button" className="button-quiet min-h-11 px-5 py-2.5" onClick={onCancel}>
            إلغاء
          </button>
        </div>
      </div>
    </dialog>
  );
}
