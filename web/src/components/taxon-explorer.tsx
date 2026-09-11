"use client";
import { useUi } from "@/components/language-provider";

import { useState } from "react";
import Link from "next/link";
import type { Taxon, SearchEntry } from "@/lib/types";
import { searchTaxa } from "@/lib/explore";

export function TaxonExplorer({
  taxa,
  entries,
}: {
  taxa: Taxon[];
  entries: SearchEntry[];
}) {
  const ui = useUi();
  const [mode, setMode] = useState("name");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ order: "", family: "", genus: "" });
  const hasCriteria = mode === "name" ? Boolean(query.trim()) : Object.values(filters).some(Boolean);
  const matches = mode === "name" ? searchTaxa(taxa, entries, query) : taxa.filter((t) =>
    Object.entries(filters).every(
      ([key, value]) => !value || t[key as keyof typeof filters] === value,
    ),
  );
  return (
    <section aria-label={ui("taxon_search")}>
      <div className="view-tabs" aria-label={ui("search_mode")}>
        <button aria-pressed={mode === "name"} onClick={() => setMode("name")}>{ui("search_by_name")}</button>
        <button aria-pressed={mode === "taxonomy"} onClick={() => setMode("taxonomy")}>{ui("browse_taxonomy")}</button>
      </div>
      {mode === "name" ? <>
      <label className="search-label" htmlFor="taxon-search">{ui("scientific_name_korean_name_or_synonym")}</label>
      <input
        id="taxon-search"
        className="search"
        type="search"
        value={query}
        placeholder={ui("enter_a_name")}
        onChange={(e) => setQuery(e.target.value)}
      />
      </> : <div className="filters">
        {(
          [
            ["order", ui("order")],
            ["family", ui("family")],
            ["genus", ui("genus")],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <select
              aria-label={label}
              value={filters[key]}
              onChange={(e) =>
                setFilters(key === "order" ? { order: e.target.value, family: "", genus: "" } : key === "family" ? { ...filters, family: e.target.value, genus: "" } : { ...filters, genus: e.target.value })
              }
            >
              <option value="">{ui("all")}{label}</option>
              {[
                ...new Set(
                  taxa
                    .filter((t) => key === "order" || ((!filters.order || t.order === filters.order) && (key === "family" || !filters.family || t.family === filters.family)))
                    .map((t) => t[key])
                    .filter((v): v is string => Boolean(v)),
                ),
              ]
                .sort()
                .map((v) => (
                  <option key={v}>{v}</option>
                ))}
            </select>
          </label>
        ))}
      </div>}
      {hasCriteria && <p className="muted" role="status">
        {matches.length}{ui("taxa_116")}</p>}
      {!taxa.length ? (
        <div className="empty">
          <h2>{ui("flora_data_is_being_prepared")}</h2>
          <p>{ui("search_by_scientific_name_korean_name_or_synonym_when_data_becom")}</p>
        </div>
      ) : !hasCriteria ? (
        <p className="empty">{mode === "name" ? ui("enter_a_scientific_name_korean_name_or_synonym_to_display_matchi") : ui("select_an_order_family_or_genus_to_display_matching_taxa")}</p>
      ) : !matches.length ? (
        <p className="empty">{ui("no_matching_taxa")}</p>
      ) : (
        <div className="taxon-list">
          {matches.map((t) => (
            <Link
              className="taxon-row"
              key={t.taxon_id}
              href={`/taxa/${t.taxon_id}`}
            >
              <span>
                <small>
                  {t.family || ui("family_not_recorded")} / {t.genus || ui("genus_not_recorded")}
                </small>
                <strong>
                  <i>{t.scientific_name}</i>
                </strong>
                <span>{t.korean_name || ui("no_korean_name_recorded")}</span>
              </span>
              <span className="row-end">
                {ui("photo_count", {count: t.image_count || 0})} <span aria-hidden>↗</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
