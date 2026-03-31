import { GRID_COLS, GRID_ROWS } from "@grid/constants";

export interface HxfPatternPayload {
  comments: string[];
  automata: number[][];
}

export function sanitizeHxfBasename(raw: string): string {
  const baseName = raw.replace(/\.hxf$/iu, "").trim();
  const sanitizedName = baseName
    .replace(/[\\/:*?"<>|]/gu, "-")
    .replace(/\s+/gu, " ")
    .trim();
  return sanitizedName || "drawing";
}

export function parseHxfImportAutomata(text: string): number[][] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("parse");
  }

  if (!parsed || typeof parsed !== "object" || !("automata" in parsed)) {
    throw new Error("parse");
  }

  const automata = (parsed as { automata: unknown }).automata;
  if (!Array.isArray(automata) || automata.length !== GRID_ROWS) {
    throw new Error("grid");
  }

  for (let row = 0; row < GRID_ROWS; row++) {
    const line = automata[row];
    if (!Array.isArray(line) || line.length !== GRID_COLS) {
      throw new Error("grid");
    }

    for (let col = 0; col < GRID_COLS; col++) {
      const cell = line[col];
      if (cell !== 0 && cell !== 1) {
        throw new Error("grid");
      }
    }
  }

  return automata as number[][];
}

export function triggerHxfDownload(payload: HxfPatternPayload, filename: string): void {
  const blob = new Blob([JSON.stringify(payload)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function patternNameFromImportFile(file: File): string {
  const stripped = file.name.replace(/\.(hxf|json)$/iu, "").trim();
  return sanitizeHxfBasename(stripped);
}
