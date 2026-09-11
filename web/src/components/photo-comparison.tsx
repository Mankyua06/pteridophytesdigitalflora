"use client";
import { useUi } from "@/components/language-provider";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MorphData, Photo, Taxon, TaxonDetail } from "@/lib/types";
import { orderedPhotos } from "@/lib/explore";
import { Photos } from "./photos";

function ComparisonColumn({ taxon, node }: { taxon: Taxon; node: string }) {
  const ui = useUi();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/data/taxa/${encodeURIComponent(taxon.taxon_id)}.json`, { signal: controller.signal });
        if (!response.ok) throw Error("Photo data request failed");
        const detail: TaxonDetail = await response.json();
        if (!controller.signal.aborted) setPhotos(orderedPhotos(detail.images, new Set([node])));
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [taxon.taxon_id, node, attempt]);
  return <article className="comparison-column" aria-label={ui("v0_comparison_photographs", {v0: taxon.korean_name || taxon.scientific_name})}>
    <div className="comparison-heading">
      <h3><Link href={`/taxa/${taxon.taxon_id}`}>{taxon.korean_name || taxon.scientific_name}</Link></h3>
      <p><i>{taxon.scientific_name}</i></p>
      {photos && <p role="status">{photos.length}{ui("photographs")}</p>}
    </div>
    {error ? <div role="alert"><p>{ui("unable_to_load_photographs")}</p><button onClick={() => {setError(false); setAttempt(a => a + 1);}}>{ui("try_again")}</button></div>
      : photos === null ? <p role="status">{ui("loading_photographs_67")}</p>
      : photos.length ? <Photos photos={photos} />
      : <p className="empty">{ui("no_photographs_recorded_for_this_feature_this_does_not_indicate_")}</p>}
  </article>;
}

export function PhotoComparison({ taxa, morph }: {taxa: Taxon[]; morph: Omit<MorphData, "links">}) {
  const ui = useUi();
  const params = useSearchParams();
  const initial = params.get("node") || "";
  const [node, setNode] = useState(morph.nodes.some(n => n.morphology_id === initial) ? initial : "");
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<{node: string; ids: string[]} | null>(null);
  const byId = new Map(taxa.map(t => [t.taxon_id, t]));
  const terms = new Map(morph.terms.map(t => [t.term_id, t]));
  const label = (id: string) => {
    const n = morph.nodes.find(n => n.morphology_id === id);
    return n?.context_label || terms.get(n?.term_id || "")?.english || id;
  };
  const changed = comparison && (comparison.node !== node || comparison.ids.join() !== selected.join());
  return <>
    <div className="filters">
      <label>{ui("feature_to_compare")}<select aria-label={ui("feature_to_compare")} value={node} onChange={e => setNode(e.target.value)}>
        <option value="">{ui("select_one_feature")}</option>
        {morph.nodes.map(n => <option value={n.morphology_id} key={n.morphology_id}>{label(n.morphology_id)} ({n.morphology_id})</option>)}
      </select></label>
      <label>{ui("add_a_taxon_to_compare")}<select aria-label={ui("add_a_taxon_to_compare")} value="" onChange={e => {const id=e.target.value;if(id) setSelected(previous => previous.includes(id) ? previous : [...previous,id]);}}>
        <option value="">{ui("choose_a_taxon_to_add")}</option>
        {taxa.filter(t => !selected.includes(t.taxon_id)).map(t => <option key={t.taxon_id} value={t.taxon_id}>{t.korean_name ? `${t.korean_name} · ` : ""}{t.scientific_name}</option>)}
      </select></label>
    </div>
    <div className="comparison-selection" aria-label={ui("selected_taxa")}>
      {selected.map(id => {const t=byId.get(id)!; return <button key={id} aria-label={ui("remove_v0", {v0: t.korean_name || t.scientific_name})} onClick={() => setSelected(ids => ids.filter(i => i !== id))}>{t.korean_name || t.scientific_name} ×</button>;})}
    </div>
    <p className="muted">{ui("compare_photographs_linked_directly_to_the_selected_feature_desc")}</p>
    <button className="compare-start" disabled={!node || selected.length < 2} onClick={() => setComparison({node, ids: [...selected]})}>{ui("compare_taxa_count", {count: selected.length})}</button>
    {!comparison && <p className="empty">{ui("select_one_feature_and_at_least_two_taxa_then_choose_compare")}</p>}
    {changed && <p role="status">{ui("your_selection_has_changed_choose_compare_to_update_the_results")}</p>}
    {comparison && <section aria-label={ui("comparison_results")}>
      <h2>{label(comparison.node)} · {comparison.ids.length}{ui("taxa_88")}</h2>
      <p className="muted">{ui("scroll_horizontally_to_view_all_selected_taxa")}</p>
      <div className="comparison-grid" tabIndex={0} role="region" aria-label={ui("photographs_by_taxon")}>
        {comparison.ids.map(id => <ComparisonColumn key={`${comparison.node}:${id}`} taxon={byId.get(id)!} node={comparison.node} />)}
      </div>
    </section>}
  </>;
}
