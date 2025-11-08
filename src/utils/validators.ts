/**
 * UUID v4 validation regex
 */
export const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 * @param value - The string to validate
 * @returns true if valid UUID v4, false otherwise
 */
export function isValidUUID(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

/**
 * Normalizes array or string query param to single string value
 * @param value - Query param value (string or string array)
 * @returns First element if array, otherwise the string value
 */
export function normalizeQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
