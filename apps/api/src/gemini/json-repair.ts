/**
 * Parses a JSON document that came back from Gemini, repairing the escaping
 * mistakes it tends to make in long or maths-heavy content first.
 */
export function parseGeminiJson<T>(text: string): T {
  // Strip markdown code fences
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  // Escape raw control characters that appear inside JSON string values.
  // Structural whitespace (between tokens) is left untouched.
  const sanitized = escapeControlCharsInStrings(cleaned);
  return JSON.parse(sanitized);
}

/**
 * LaTeX commands that start with n, r or t. Written with a single backslash,
 * JSON would read them as \n, \r or \t (\theta → TAB + "heta").
 */
const LATEX_COMMANDS_LIKE_ESCAPES = new Set(
  [
    "nabla ne neq neg nexists ngeq ni nleq nmid not notin nu newline",
    "rangle rbrace rceil rfloor rho right rightarrow rightleftharpoons rvert",
    "tan tanh tau tbinom text textbf textit textrm texttt tfrac",
    "therefore theta tilde times to top triangle",
  ]
    .join(" ")
    .split(" "),
);

const LETTER_RUN = /[A-Za-z]+/y;

/** True when the letters starting at `start` spell a whole listed LaTeX command. */
function startsLatexCommand(text: string, start: number): boolean {
  LETTER_RUN.lastIndex = start;
  const match = LETTER_RUN.exec(text);
  return match !== null && LATEX_COMMANDS_LIKE_ESCAPES.has(match[0]);
}

/**
 * Walks the raw JSON text character-by-character and fixes two classes of
 * problems that Gemini introduces in long/rich content:
 *
 * 1. Raw control characters (U+0000–U+001F) inside string values are
 *    escaped to \n, \r, \t, or \uXXXX as required by the JSON spec.
 *
 * 2. Invalid or ambiguous backslash sequences inside string values.
 *    Gemini emits LaTeX like \frac, \sqrt, \alpha, \pm, \[ etc.
 *    Only  \" \\  \/ \n \r \t  are safe to pass through unchanged, plus
 *    \uXXXX when four hex digits genuinely follow — \university must not
 *    be mistaken for a unicode escape.
 *    \b and \f are technically valid JSON escapes but Gemini almost never
 *    means backspace/form-feed — it means \beta, \frac etc., so they are
 *    also treated as bare backslashes and doubled.
 *    \n \r \t are doubled the same way when the letters after the backslash
 *    spell a whole LaTeX command (\theta, \neq, \right), so "\nThe" is
 *    still a newline but "\theta" is not a tab.
 *    Any other \X has its backslash doubled so JSON.parse sees a literal \.
 *
 * Invariant: when a backslash is treated as literal, the index advances by
 * only 1 (past the \ itself); the following character is processed on the
 * next iteration and receives its own control-char treatment if needed.
 */
export function escapeControlCharsInStrings(text: string): string {
  // Only these characters after \ are unambiguous safe JSON escapes.
  // \b and \f are intentionally excluded — Gemini uses them for LaTeX.
  // \u is handled separately below because it needs four hex digits.
  const SAFE_ESCAPES = new Set(['"', "\\", "/", "n", "r", "t"]);
  const FOUR_HEX_DIGITS = /^[0-9a-fA-F]{4}$/;

  // Collect the pieces and join once at the end rather than growing one
  // string on every character.
  const pieces: string[] = [];
  let insideString = false;
  let index = 0;

  while (index < text.length) {
    const character = text[index];

    // ── outside a string ─────────────────────────────────────────────────
    if (!insideString) {
      if (character === '"') insideString = true;
      pieces.push(character);
      index++;
      continue;
    }

    // ── inside a string ──────────────────────────────────────────────────

    if (character === "\\") {
      const nextCharacter = index + 1 < text.length ? text[index + 1] : "";

      if (nextCharacter === "u") {
        // \uXXXX is a real escape only when four hex digits actually
        // follow. Gemini writes words like \university, and consuming the
        // next four characters blindly emitted "\unive", which is an
        // invalid escape that made JSON.parse throw.
        const possibleHexDigits = text.slice(index + 2, index + 6);
        if (FOUR_HEX_DIGITS.test(possibleHexDigits)) {
          pieces.push("\\u", possibleHexDigits);
          index += 6;
        } else {
          pieces.push("\\\\");
          index += 1;
        }
      } else if (
        SAFE_ESCAPES.has(nextCharacter) &&
        !startsLatexCommand(text, index + 1)
      ) {
        // Safe escape — keep the \ and consume next char together
        pieces.push("\\", nextCharacter);
        index += 2;
      } else {
        // Bare or ambiguous backslash (LaTeX, etc.) — escape only the \
        // The character after it is left for the next iteration so it gets
        // its own control-char check if necessary.
        pieces.push("\\\\");
        index += 1;
      }
      continue;
    }

    if (character === '"') {
      insideString = false;
      pieces.push(character);
      index++;
      continue;
    }

    // Raw control character inside a string
    const characterCode = character.charCodeAt(0);
    if (characterCode < 0x20) {
      switch (character) {
        case "\n":
          pieces.push("\\n");
          break;
        case "\r":
          pieces.push("\\r");
          break;
        case "\t":
          pieces.push("\\t");
          break;
        default:
          pieces.push("\\u" + characterCode.toString(16).padStart(4, "0"));
      }
      index++;
      continue;
    }

    pieces.push(character);
    index++;
  }

  return pieces.join("");
}
