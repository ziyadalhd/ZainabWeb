"use client";

import { useEffect, useRef, useState } from "react";
import { PosterFrame } from "@/components/ui/PosterFrame";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { identityTransform, type CropTransform } from "@/lib/media/crop-geometry";

/** The ratio every poster surface is built around: `aspect-[4/5]` in the admin previews and on the public page. */
export const POSTER_ASPECT_RATIO = 4 / 5;

/**
 * Puts a `File` into a file input so the form submits it.
 *
 * The cropped image never came from a file picker, so the input has nothing to submit unless its
 * `files` list is replaced. Doing it this way keeps the poster on the ordinary multipart form path —
 * same field name, same server action, same validation — instead of inventing a second upload route
 * for cropped images. Returns false where `DataTransfer` is unavailable so the caller can fall back
 * to the file the admin originally picked.
 */
function putFileInInput(input: HTMLInputElement | null, file: File): boolean {
  if (!input || typeof DataTransfer === "undefined") return false;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  return true;
}

interface EventPosterFieldProps {
  inputId: string;
  label: string;
  /** The stored poster, shown until the admin picks a replacement. */
  currentPosterUrl: string | null;
  previewAlt: string;
  onPreviewChange?: (previewUrl: string | null) => void;
  onPicked?: () => void;
  required?: boolean;
}

/**
 * The poster picker: choose a file, frame it, and keep the framing adjustable until the form is
 * submitted.
 *
 * Selecting a file opens the cropper rather than accepting the file as-is, because the surfaces
 * that show a poster all use one fixed aspect and an unframed upload gets whatever the browser's
 * `object-fit` decides. What the admin sees in the frame is what gets stored.
 */
export function EventPosterField({ inputId, label, currentPosterUrl, previewAlt, onPreviewChange, onPicked, required = false }: EventPosterFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // The picked file is kept untouched so re-adjusting re-frames the original pixels. Re-cropping an
  // already-cropped file would throw away everything outside the previous frame, making each pass
  // permanently tighter than the last.
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cropped, setCropped] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transform, setTransform] = useState<CropTransform>(identityTransform);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function pickFile(file: File | undefined) {
    if (!file) return;
    setOriginalFile(file);
    setTransform(identityTransform);
    setPendingFile(file);
  }

  function cancelCrop() {
    setPendingFile(null);
    // Nothing has been framed yet, so leave the input empty rather than submitting an unframed file.
    if (!cropped && inputRef.current) inputRef.current.value = "";
  }

  function applyCrop(croppedFile: File) {
    setPendingFile(null);
    setCropped(true);
    // No DataTransfer support: the admin's untouched selection is still in the input and still
    // valid to upload, so the framing is lost but the poster is not.
    putFileInInput(inputRef.current, croppedFile);
    const url = URL.createObjectURL(croppedFile);
    setPreviewUrl(url);
    onPreviewChange?.(url);
    onPicked?.();
  }

  const shownUrl = previewUrl ?? currentPosterUrl;

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <p className="mb-3 text-sm muted-copy">اختياري. يقبل PNG أو JPG أو WebP، ويُقصّ إلى إطار البطاقة قبل الرفع.</p>

      {shownUrl ? (
        <div className="mb-3 grid gap-2">
          <p className="text-sm font-medium text-[var(--brand-forest)]">{previewUrl ? "معاينة البوستر بعد القصّ" : "البوستر الحالي"}</p>
          <PosterFrame
            src={shownUrl}
            alt={previewAlt}
            sizes="(min-width: 640px) 28rem, 100vw"
            className="aspect-[4/5] w-full max-w-md rounded-[var(--radius-surface)] border border-[var(--color-border)]"
          />
        </div>
      ) : null}

      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        name="poster"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="field-control block text-sm"
        required={required}
        onChange={(changeEvent) => pickFile(changeEvent.target.files?.[0])}
      />

      {cropped && originalFile ? (
        <button type="button" className="button-quiet mt-3 min-h-10 px-3 py-2 text-sm" onClick={() => setPendingFile(originalFile)}>
          إعادة ضبط الإطار
        </button>
      ) : null}

      {pendingFile ? (
        <ImageCropper
          key={`${pendingFile.name}:${pendingFile.size}:${pendingFile.lastModified}`}
          file={pendingFile}
          aspectRatio={POSTER_ASPECT_RATIO}
          title="ضبط إطار البوستر"
          initialTransform={transform}
          onTransformChange={setTransform}
          onCancel={cancelCrop}
          onApply={applyCrop}
        />
      ) : null}
    </div>
  );
}
