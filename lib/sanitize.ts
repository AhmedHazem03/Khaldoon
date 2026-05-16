// Matches C0 controls (except \t/\n/\r), DEL, C1 controls, and the bidi
// overrides that can mangle Arabic-script messages (LRE/RLE/PDF/LRO/RLO/
// LRI/RLI/FSI/PDI).
const UNSAFE_CHARS =
  // eslint-disable-next-line no-control-regex
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F‪-‮⁦-⁩]/g;

/**
 * Strip control characters and bidi-override characters from user-supplied
 * text before it is stored or sent over WhatsApp.
 */
export function stripUnsafeChars(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(UNSAFE_CHARS, "").trim();
}
