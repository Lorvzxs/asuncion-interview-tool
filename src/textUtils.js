/** Uppercase text as the user types (preserves internal spacing). */
export function toUpperCaseInput(value) {
  return value.toUpperCase();
}

/** Trim and uppercase before persisting or submitting. */
export function normalizeStoredText(value) {
  return value.trim().toUpperCase();
}
