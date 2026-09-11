
import type { MorphNode, Photo, SearchEntry, Taxon } from "./types";
export function searchTaxa(
  taxa: Taxon[],
  entries: SearchEntry[],
  query: string,
) {
  const q = query.trim().normalize("NFKC").toLocaleLowerCase();
  if (!q) return taxa;
  const ids = new Set(
    entries
      .filter((e) =>
        e.names.some((n) =>
          n.normalize("NFKC").toLocaleLowerCase().includes(q),
        ),
      )
      .map((e) => e.taxon_id),
  );
  return taxa.filter((t) => ids.has(t.taxon_id));
}
export function descendants(
  nodes: MorphNode[],
  id: string,
  include: boolean,
): Set<string> {
  const result = new Set([id]);
  if (!include) return result;
  const queue = [id];
  while (queue.length) {
    const parent = queue.shift();
    for (const node of nodes)
      if (node.parent_id === parent && !result.has(node.morphology_id)) {
        result.add(node.morphology_id);
        queue.push(node.morphology_id);
      }
  }
  return result;
}
export function orderedPhotos(
  photos: Photo[],
  selected?: Set<string>,
): Photo[] {
  const unique = [...new Map(photos.map((p) => [p.image_id, p])).values()];
  const matching = (p: Photo) =>
    p.morphology.filter((l) => !selected || selected.has(l.morphology_id));
  return unique
    .filter((p) => !selected || matching(p).length > 0)
    .sort((a, b) => {
      const al = matching(a),
        bl = matching(b);
      const representative =
        Number(bl.some((l) => l.representative)) -
        Number(al.some((l) => l.representative));
      const order =
        Math.min(...al.map((l) => l.display_order), Number.MAX_SAFE_INTEGER) -
        Math.min(...bl.map((l) => l.display_order), Number.MAX_SAFE_INTEGER);
      return representative || order || a.image_id.localeCompare(b.image_id);
    });
}
export const presenceLabels: Record<string, string> = {
  present: "present",
  absent: "absent",
  unknown: "presence_unknown",
  variable: "variable",
};
export const documentationLabels: Record<string, string> = {
  documented: "documented",
  missing: "not_documented",
  not_examined: "not_examined",
  not_applicable: "not_applicable",
};

/** Retain photo-linked nodes and their ancestors, without inferring presence. */
export function photoTreeNodes(nodes: MorphNode[], photos: Photo[]) {
  const byId = new Map(nodes.map(n => [n.morphology_id, n]));
  const visible = new Set<string>();
  for (const photo of photos) for (const link of photo.morphology) {
    let id: string | null = link.morphology_id;
    while (id && byId.has(id) && !visible.has(id)) {
      visible.add(id);
      id = byId.get(id)!.parent_id;
    }
  }
  return nodes.filter(n => visible.has(n.morphology_id));
}
