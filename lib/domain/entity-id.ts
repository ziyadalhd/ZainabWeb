const entityIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Validates a database primary-key UUID (v1-8, RFC-4122 variant) before it reaches a query. */
export function isEntityId(value: string): boolean {
  return entityIdPattern.test(value);
}
