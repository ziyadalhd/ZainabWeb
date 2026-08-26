export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; code: "load_failed" };

export function ok<T>(data: T): RepositoryResult<T> {
  return { ok: true, data };
}

export function loadFailed<T = never>(): RepositoryResult<T> {
  return { ok: false, code: "load_failed" };
}
