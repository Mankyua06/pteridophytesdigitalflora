import type { Taxon } from "./types";

export function holdingsCoverage(taxa: Taxon[]) {
  const held = taxa.filter(t => t.holding_status === "held");
  const photographed = held.filter(t => (t.image_count || 0) > 0).length;
  return { total: taxa.length, held: held.length, notHeld: taxa.length - held.length, photographed };
}

export type CoverageLink = { taxon_id: string; morphology_id: string };
export function coverage(taxa: Taxon[], links: CoverageLink[], feature = "") {
  const covered = new Set(links.filter(l => !feature || l.morphology_id === feature).map(l => l.taxon_id));
  return (["order", "family", "genus", "taxa"] as const).map(rank => {
    const groups = new Map<string, boolean>();
    let missing = 0;
    for (const taxon of taxa) {
      const key = rank === "taxa" ? taxon.taxon_id : taxon[rank]?.trim();
      if (!key) { missing++; continue; }
      groups.set(key, Boolean(groups.get(key)) || covered.has(taxon.taxon_id));
    }
    return { rank, total: groups.size, covered: [...groups.values()].filter(Boolean).length, missing };
  });
}
