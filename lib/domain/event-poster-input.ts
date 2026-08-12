const extensionsByMimeType: Record<string, "png" | "jpg" | "webp"> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export type EventPosterInputResult =
  | { ok: true; extension: "png" | "jpg" | "webp" }
  | { ok: false; error: "file" | "type" };

export function validateEventPoster(file: FormDataEntryValue | null): EventPosterInputResult {
  if (!(file instanceof File) || file.size < 1) return { ok: false, error: "file" };
  const extension = extensionsByMimeType[file.type];
  return extension ? { ok: true, extension } : { ok: false, error: "type" };
}
