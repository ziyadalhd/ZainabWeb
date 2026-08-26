function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string" && code.length > 0) return code;
  }
  return "unknown";
}

/**
 * Logs a data-access failure without the underlying error object, which may embed row values
 * (Postgres constraint violations, PostgREST filter echoes) in its message. Only the machine
 * error code and the calling scope are recorded.
 */
export function logRepositoryFailure(scope: string, error: unknown): void {
  console.error(`[${scope}] load failed`, { code: errorCode(error) });
}
