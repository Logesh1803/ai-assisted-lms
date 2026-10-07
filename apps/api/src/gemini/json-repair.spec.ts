import { escapeControlCharsInStrings, parseGeminiJson } from "./json-repair";

/** Parses through the repair step and returns the resulting object. */
const repairAndParse = (raw: string) => parseGeminiJson<any>(raw);

/** A raw U+0001, written as an escape so it stays visible in this file. */
const START_OF_HEADING = String.fromCharCode(0x01);

describe("parseGeminiJson", () => {
  it("parses ordinary JSON unchanged", () => {
    expect(repairAndParse('{"title":"Algebra","order":1}')).toEqual({
      title: "Algebra",
      order: 1,
    });
  });

  it("strips the markdown code fences Gemini wraps answers in", () => {
    const raw = '```json\n{"title":"Algebra"}\n```';
    expect(repairAndParse(raw)).toEqual({ title: "Algebra" });
  });

  it("keeps real escape sequences working", () => {
    const raw = '{"text":"a \\"quoted\\" word and a back\\\\slash"}';
    expect(repairAndParse(raw).text).toBe('a "quoted" word and a back\\slash');
  });

  it("repairs a raw newline sitting inside a string value", () => {
    // Gemini emits literal newlines inside JSON strings, which is invalid
    const raw = '{"content":"line one\nline two"}';
    expect(repairAndParse(raw).content).toBe("line one\nline two");
  });

  it("repairs raw tabs and carriage returns inside a string value", () => {
    const raw = '{"content":"col one\tcol two\r"}';
    expect(repairAndParse(raw).content).toBe("col one\tcol two\r");
  });

  it("keeps LaTeX backslashes instead of choking on them", () => {
    const raw = '{"formula":"\\frac{1}{2} and \\alpha"}';
    expect(repairAndParse(raw).formula).toBe("\\frac{1}{2} and \\alpha");
  });

  it("keeps \\b and \\f as literal backslashes, not control characters", () => {
    // Gemini means \beta and \frac, never backspace or form-feed
    const raw = '{"formula":"\\beta and \\frac"}';
    expect(repairAndParse(raw).formula).toBe("\\beta and \\frac");
  });

  it("keeps LaTeX commands that start with n, r or t", () => {
    const raw =
      '{"formula":"\\theta \\neq \\nabla f, x \\to 0, \\left(x\\right)"}';
    expect(repairAndParse(raw).formula).toBe(
      "\\theta \\neq \\nabla f, x \\to 0, \\left(x\\right)",
    );
  });

  it("still reads \\n, \\r and \\t before ordinary words as escapes", () => {
    const raw = '{"text":"Step one\\nThe answer\\ttext\\r"}';
    expect(repairAndParse(raw).text).toBe("Step one\nThe answer\ttext\r");
  });

  it("still honours a genuine \\uXXXX escape", () => {
    const raw = '{"text":"\\u0041\\u0042"}';
    expect(repairAndParse(raw).text).toBe("AB");
  });

  it("does not mistake a word starting with \\u for a unicode escape", () => {
    // "\university" used to have its next four characters eaten, producing
    // the invalid escape "\unive" and making JSON.parse throw.
    const raw = '{"text":"enrolled at \\university today"}';
    expect(repairAndParse(raw).text).toBe("enrolled at \\university today");
  });

  it("handles \\u followed by too few hex digits at the very end", () => {
    const raw = '{"text":"trailing \\u12"}';
    expect(repairAndParse(raw).text).toBe("trailing \\u12");
  });

  it("leaves structural whitespace between tokens alone", () => {
    const raw = '{\n  "a": 1,\n  "b": [1, 2]\n}';
    expect(repairAndParse(raw)).toEqual({ a: 1, b: [1, 2] });
  });

  it("parses a realistic lesson payload with markdown and maths", () => {
    const raw = [
      "```json",
      "{",
      '  "title": "Quadratics",',
      '  "content": "Use \\frac{-b}{2a}.',
      'Then check \\alpha \\ge 0."',
      "}",
      "```",
    ].join("\n");

    const parsed = repairAndParse(raw);
    expect(parsed.title).toBe("Quadratics");
    expect(parsed.content).toContain("\\frac{-b}{2a}");
    expect(parsed.content).toContain("\\alpha");
  });
});

describe("escapeControlCharsInStrings", () => {
  it("leaves text outside strings untouched", () => {
    expect(escapeControlCharsInStrings('{"a":1}')).toBe('{"a":1}');
  });

  it("escapes a newline inside a string but not between tokens", () => {
    expect(escapeControlCharsInStrings('{\n"a":"x\ny"\n}')).toBe(
      '{\n"a":"x\\ny"\n}',
    );
  });

  it("escapes an exotic control character as \\uXXXX", () => {
    expect(escapeControlCharsInStrings(`"${START_OF_HEADING}"`)).toBe(
      '"\\u0001"',
    );
  });
});
