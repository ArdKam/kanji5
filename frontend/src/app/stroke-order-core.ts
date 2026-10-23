export const STROKE_ORDER_VERSION = "1.0.0";
export const KANJIVG_BASE_URL = "https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji";

export function normalizeStrokeOrderCharacter(value: unknown): string {
  return Array.from(String(value || "").trim()).slice(0, 1).join("");
}

export function kanjiSvgUrl(character: string): string {
  const normalized = normalizeStrokeOrderCharacter(character);
  if (!normalized) return "";
  const codePoint = normalized.codePointAt(0);
  if (codePoint === undefined) return "";
  const filename = codePoint.toString(16).padStart(5, "0").toLowerCase() + ".svg";
  return KANJIVG_BASE_URL + "/" + filename;
}

export type StrokePath = { strokeNumber: number; d: string };

export function parseStrokePaths(svgText: string): StrokePath[] {
  const source = String(svgText || "");
  const rows: StrokePath[] = [];
  const pattern = /<path\s+id="[^"]+-s(\d+)"[^>]*\bd="([^"]+)"/g;
  for (const match of source.matchAll(pattern)) {
    const strokeNumber = Number(match[1]);
    const d = String(match[2] || "").trim();
    if (!Number.isInteger(strokeNumber) || strokeNumber < 1 || !d) continue;
    rows.push({ strokeNumber, d });
  }
  rows.sort((a, b) => a.strokeNumber - b.strokeNumber || a.d.localeCompare(b.d));
  const unique: StrokePath[] = [];
  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.strokeNumber)) continue;
    seen.add(row.strokeNumber);
    unique.push(row);
  }
  return unique;
}
