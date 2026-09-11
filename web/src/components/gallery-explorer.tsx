"use client";
import { useUi } from "@/components/language-provider";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MorphData, Photo, Taxon, TaxonDetail } from "@/lib/types";
import { descendants, orderedPhotos } from "@/lib/explore";
import { Photos } from "./photos";

function PhotoBatch({
  ids,
  selected,
}: {
  ids: string[];
  selected?: Set<string>;
}) {
  const ui = useUi();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loaded, setLoaded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function first() {
      try {
        const batch = await Promise.all(
          ids.slice(0, 12).map(async (id) => {
            const response = await fetch(
              `/data/taxa/${encodeURIComponent(id)}.json`,
              { signal: controller.signal },
            );
            if (!response.ok) throw new Error("Photo data request failed");
            return (await response.json()) as TaxonDetail;
          }),
        );
        if (!controller.signal.aborted) {
          setPhotos(batch.flatMap((d) => d.images));
          setLoaded(Math.min(12, ids.length));
          setLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError(true);
          setLoading(false);
        }
      }
    }
    void first();
    return () => controller.abort();
  }, [ids]);
  async function more() {
    setLoading(true);
    setError(false);
    try {
      const batch = await Promise.all(
        ids.slice(loaded, loaded + 12).map(async (id) => {
          const response = await fetch(
            `/data/taxa/${encodeURIComponent(id)}.json`,
          );
          if (!response.ok) throw new Error("Photo data request failed");
          return (await response.json()) as TaxonDetail;
        }),
      );
      setPhotos((previous) => [...previous, ...batch.flatMap((d) => d.images)]);
      setLoaded(Math.min(loaded + 12, ids.length));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  const visible = orderedPhotos(photos, selected);
  return (
    <>
      {error && (
        <p role="alert">{ui("unable_to_load_photographs_refresh_the_page_and_try_again")}</p>
      )}
      {!loading && (
        <p className="muted">
          {loaded} / {ids.length}{ui("taxa_loaded")}</p>
      )}
      {!loading && !visible.length && loaded < ids.length ? (
        <p className="empty">{ui("no_matching_photographs_in_the_loaded_data_load_the_next_batch_t")}</p>
      ) : photos.length > 0 || !loading ? (
        <Photos key={[...(selected || [])].join(",")} photos={visible} />
      ) : null}
      {loading && <p role="status">{ui("loading_photographs_67")}</p>}
      {loaded < ids.length && (
        <button disabled={loading} onClick={() => void more()}>{ui("load_more_photographs")}</button>
      )}
    </>
  );
}

export function GalleryExplorer({
  taxa,
  morph,
  initialNode = "",
}: {
  taxa: Taxon[];
  morph: Omit<MorphData, "links">;
  initialNode?: string;
}) {
  const ui = useUi();
  const [taxon, setTaxon] = useState("");
  const [node, setNode] = useState(initialNode);
  const [include, setInclude] = useState(true);
  const selected = node ? descendants(morph.nodes, node, include) : undefined;
  // Only compact taxon IDs enter the initial client payload. Detailed photos load in batches.
  const ids = taxa
    .filter((t) => t.taxon_id === taxon)
    .map((t) => t.taxon_id);
  const terms = new Map(morph.terms.map((t) => [t.term_id, t]));
  return (
    <>
      <div className="filters">
        <label>{ui("taxa")}<select aria-label={ui("photo_taxon")} value={taxon} onChange={(e) => setTaxon(e.target.value)}>
            <option value="">{ui("select_a_taxon")}</option>
            {[...taxa].sort((a, b) => a.scientific_name.localeCompare(b.scientific_name, "en") || a.taxon_id.localeCompare(b.taxon_id)).map((t) => (
              <option key={t.taxon_id} value={t.taxon_id}>
                {t.scientific_name}
              </option>
            ))}
          </select>
        </label>
        <label>{ui("morphological_features")}<select value={node} onChange={(e) => setNode(e.target.value)}>
            <option value="">{ui("all_features_including_unlinked_photographs")}</option>
            {morph.nodes.map((n) => (
              <option key={n.morphology_id} value={n.morphology_id}>
                {n.context_label || terms.get(n.term_id)?.english} (
                {n.morphology_id})
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={include}
            onChange={(e) => setInclude(e.target.checked)}
          />{ui("include_descendant_features")}</label>
      </div>
      <p className="muted">
        {node
          ? include
            ? ui("photographs_of_the_selected_feature_and_its_descendants")
            : ui("photographs_linked_directly_to_the_selected_feature")
          : ui("includes_photographs_without_a_morphology_link")}
      </p>
      <p><Link className="primary-link" href={`/compare${node ? `?node=${encodeURIComponent(node)}` : ""}`}>{ui("compare_morphology_across_taxa")}</Link></p>
      {taxon ? <PhotoBatch
        key={`${taxon}:${node}:${include}`}
        ids={ids}
        selected={selected}
      /> : <p className="empty">{ui("select_a_taxon_to_display_photographs")}</p>}
    </>
  );
}
