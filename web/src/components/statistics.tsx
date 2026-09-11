"use client";
import { useState } from "react";
import { useUi } from "./language-provider";
import { coverage, type CoverageLink } from "@/lib/statistics";
import type { Taxon, MorphNode, Term } from "@/lib/types";

export function Statistics({taxa, nodes, terms, links, photoCount}: {
  taxa: Taxon[]; nodes: MorphNode[]; terms: Term[]; links: CoverageLink[]; photoCount: number;
}) {
  const ui = useUi();
  const [feature, setFeature] = useState("");
  const rows = coverage(taxa, links, feature);
  const names = new Map(terms.map(t => [t.term_id, t.english]));
  const linkedFeatures = new Set(links.map(l => l.morphology_id));
  return <>
    <div className="stats statistics-totals">
      {[[taxa.length,"published_taxa"],[nodes.length,"morphological_features"],[photoCount,"published_photographs"],[linkedFeatures.size,"features_with_photographs"]].map(([count,key]) =>
        <div key={key}><strong>{count}</strong><span>{ui(String(key))}</span></div>)}
    </div>
    <section aria-labelledby="coverage-heading">
      <h2 id="coverage-heading">{ui("photographic_coverage")}</h2>
      <p>{ui("coverage_definition")}</p>
      <label className="statistics-filter">{ui("coverage_feature")}<select aria-label={ui("coverage_feature")} value={feature} onChange={e => setFeature(e.target.value)}>
        <option value="">{ui("any_morphological_feature")}</option>
        {nodes.map(n => <option key={n.morphology_id} value={n.morphology_id}>{n.context_label || names.get(n.term_id)} ({n.morphology_id})</option>)}
      </select></label>
      <p className="muted">{ui("coverage_feature_note")}</p>
      <div className="coverage-grid" aria-live="polite">
        {rows.map(row => {
          const percentage = row.total ? row.covered / row.total * 100 : 0;
          return <article className="coverage-card" key={row.rank} data-rank={row.rank}>
            <h3>{ui(`statistics_${row.rank}`)}</h3>
            <div className="coverage-donut" role="img" aria-label={ui("coverage_chart_label", {covered:row.covered,total:row.total})}
              style={{background:`conic-gradient(var(--coverage-green) ${percentage}%, var(--coverage-empty) 0)`}}>
              <div><strong>{row.total ? `${percentage.toFixed(1)}%` : "—"}</strong><span>{row.covered} / {row.total}</span></div>
            </div>
            <dl className="coverage-legend">
              <div><dt><span className="coverage-dot" />{ui("with_photographs")}</dt><dd>{row.covered}</dd></div>
              <div><dt><span className="coverage-dot empty-dot" />{ui("without_photographs")}</dt><dd>{row.total-row.covered}</dd></div>
            </dl>
            {!row.total && <p>{ui("no_groups_recorded")}</p>}
            {row.missing > 0 && <p className="muted">{ui("classification_missing_count", {count:row.missing})}</p>}
          </article>;
        })}
      </div>
      <p className="muted">{ui("coverage_scope_note")}</p>
    </section>
  </>;
}
