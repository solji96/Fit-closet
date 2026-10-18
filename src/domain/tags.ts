const NORMALIZE = (value: string) => value.replace(/\s+/g, "").replace(/[·/,]/g, "").toLowerCase();

/** Compact chip label. Full bilingual form is for headings and aria names. */
export const COMFORTABLE_CASUAL_LABEL = "컴포터블 캐주얼";
export const COMFORTABLE_CASUAL_LABEL_FULL = "컴포터블 캐주얼 (Comfortable Casual)";

/** Display-only substitutions. Stored ids such as `boxy` or `natural_comfort` stay unchanged. */
const DISPLAY_PHRASES: Array<[string, string]> = [
  ["꾸안꾸", COMFORTABLE_CASUAL_LABEL],
  ["내추럴 라운지", COMFORTABLE_CASUAL_LABEL],
  ["박시", "오버핏"],
];

export function displayItemName(name: string): string {
  return DISPLAY_PHRASES.reduce((next, [from, to]) => next.replaceAll(from, to), name);
}

export function uniqueDisplayTags(parts: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const value = part?.trim() ? displayItemName(part.trim()) : "";
    if (!value) continue;
    const key = NORMALIZE(value);
    if (!key || seen.has(key)) continue;
    if ([...seen].some((existing) => existing === key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

export function itemDisplayTags(item: {
  color?: string;
  colorTone?: string;
  fit?: string;
  style?: string;
  material?: string;
  styleLabel?: string;
  fitLabel?: string;
}): string[] {
  const color = item.colorTone?.trim() || item.color?.trim();
  const fit = item.fitLabel ?? item.fit;
  const style = item.styleLabel ?? item.style;
  const material = item.material;
  const skipMaterial =
    Boolean(material) &&
    (style === material ||
      fit === material ||
      Boolean(color && material && NORMALIZE(color).includes(NORMALIZE(material))) ||
      (NORMALIZE(material ?? "") === "데님" && Boolean(item.colorTone)));
  const skipStyle = Boolean(item.colorTone) && (style === "데님" || item.style === "denim");
  return uniqueDisplayTags([color, fit, skipStyle ? undefined : style, skipMaterial ? undefined : material]);
}
