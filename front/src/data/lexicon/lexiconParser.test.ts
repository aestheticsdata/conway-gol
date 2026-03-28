import { describe, expect, it } from "vitest";
import { parseLifeLexicon } from "./lexiconParser";

describe("parseLifeLexicon", () => {
  it("parses entries, modifiers, references and pattern previews", () => {
    const sampleLexicon = `LIFE LEXICON
  Release 1, 2026 March 28
  ASCII version

COPYING
  Freely copied under the Creative Commons Attribution-ShareAlike 3.0 Unported licence (CC BY-SA 3.0).

-------

:Foo Bar: (p3)  Found by Jane Doe in March 1991.  Compare {baz}.
\t.*.
\t***
\t.*.

:Baz:  See {Foo Bar}.
`;

    const parsed = parseLifeLexicon(sampleLexicon);

    expect(parsed.title).toBe("LIFE LEXICON");
    expect(parsed.entryCount).toBe(2);
    expect(parsed.patternEntryCount).toBe(1);
    expect(parsed.referenceCount).toBe(2);
    expect(parsed.entries[0]?.modifiers).toBe("(p3)");
    expect(parsed.entries[0]?.patternCard?.author).toBe("Jane Doe");
    expect(parsed.entryAnchorByNormalizedTerm.get("foobar")).toBe(parsed.entries[0]?.anchorId);
    expect(parsed.entries[1]?.blocks[0]).toMatchObject({
      type: "paragraph",
      inline: [
        { type: "text", value: "See " },
        { type: "reference", label: "Foo Bar", normalizedTarget: "foobar" },
        { type: "text", value: "." },
      ],
    });
  });
});
