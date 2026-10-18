export type KeepKind = "item" | "look" | "wish";

export interface KeepEntry {
  kind: KeepKind;
  id: string;
  name: string;
  detail?: string;
}

const KINDS = new Set<KeepKind>(["item", "look", "wish"]);

export function sanitizeKeeps(value: unknown): KeepEntry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const next: KeepEntry[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as Partial<KeepEntry>;
    if (!entry.kind || !KINDS.has(entry.kind)) continue;
    if (typeof entry.id !== "string" || !entry.id.trim() || entry.id.length > 240) continue;
    if (typeof entry.name !== "string" || !entry.name.trim()) continue;
    const id = entry.id.trim();
    const key = `${entry.kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const detail = typeof entry.detail === "string" ? entry.detail.trim().slice(0, 80) : "";
    next.push({
      kind: entry.kind,
      id,
      name: entry.name.trim().slice(0, 80),
      ...(detail ? { detail } : {}),
    });
    if (next.length >= 200) break;
  }
  return next;
}

export function isKept(list: KeepEntry[], kind: KeepKind, id: string): boolean {
  return list.some((entry) => entry.kind === kind && entry.id === id);
}

export function toggleKeep(list: KeepEntry[], entry: KeepEntry): KeepEntry[] {
  if (isKept(list, entry.kind, entry.id)) {
    return list.filter((item) => !(item.kind === entry.kind && item.id === entry.id));
  }
  return [...list, entry];
}

export function pruneItemKeeps(list: KeepEntry[], wardrobeIds: Set<string>): KeepEntry[] {
  return list.filter((entry) => entry.kind !== "item" || wardrobeIds.has(entry.id));
}

export function lookKeepId(itemIds: string[]): string {
  return [...itemIds].sort().join("|");
}
