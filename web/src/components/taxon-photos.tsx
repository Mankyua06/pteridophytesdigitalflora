"use client";
import { useUi } from "@/components/language-provider";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { MorphNode, Photo, Term } from "@/lib/types";
import { descendants, orderedPhotos, photoTreeNodes } from "@/lib/explore";
import { Photos } from "./photos";
export function TaxonPhotos({photos, nodes, terms}: {photos: Photo[]; nodes: MorphNode[]; terms: Term[]}) {
  const ui = useUi();
 const pathname = usePathname();
 const search = useSearchParams();
 const selected = search.get("node") || "";
 const include = search.get("include") !== "false";
 const visible = photoTreeNodes(nodes, photos);
 const byId = new Map(nodes.map(n => [n.morphology_id, n]));
 const label = (n: MorphNode) => n.context_label || terms.find(t => t.term_id === n.term_id)?.english || n.morphology_id;
 const href = (id: string, children = include) => `${pathname}${id ? `?node=${encodeURIComponent(id)}&include=${children}` : ""}`;
 const path: MorphNode[] = [];
 let current = byId.get(selected);
 while(current && !path.includes(current)) { path.unshift(current); current = byId.get(current.parent_id || ""); }
 const filtered = orderedPhotos(photos, selected ? descendants(nodes, selected, include) : undefined);
 function branch(parent: string | null): React.ReactNode {
  const children = visible.filter(n => n.parent_id === parent).sort((a,b) => a.display_order-b.display_order || a.morphology_id.localeCompare(b.morphology_id));
  return children.length ? <ul>{children.map(n => <li key={n.morphology_id}><Link href={href(n.morphology_id)} scroll={false} aria-current={selected === n.morphology_id ? "true" : undefined}>{label(n)} <small>({orderedPhotos(photos, descendants(nodes, n.morphology_id, true)).length})</small></Link>{branch(n.morphology_id)}</li>)}</ul> : null;
 }
 if (!photos.length) return <p className="empty">{ui("no_photographs_recorded_photographic_coverage_does_not_determine")}</p>;
 return <div className="photo-explorer">
  <aside><details open className="photo-tree"><summary>{ui("features_with_photographs")}</summary><nav aria-label={ui("taxon_photo_morphology_tree")}><Link href={pathname} scroll={false} aria-current={!selected ? "true" : undefined}>{ui("all_photographs")}{photos.length})</Link>{branch(null)}</nav></details></aside>
  <section className="photo-results">
   <nav className="photo-breadcrumb" aria-label={ui("selected_feature_path")}><Link href={pathname} scroll={false}>{ui("all_photographs_132")}</Link>{path.map(n => <span key={n.morphology_id}> / <Link href={href(n.morphology_id)} scroll={false}>{label(n)}</Link></span>)}</nav>
   {selected && <div className="view-tabs"><Link href={href(selected, true)} scroll={false} aria-current={include ? "true" : undefined}>{ui("include_descendants")}</Link><Link href={href(selected, false)} scroll={false} aria-current={!include ? "true" : undefined}>{ui("selected_feature_only")}</Link></div>}
   <p role="status">{filtered.length}{ui("photographs")}{selected && !byId.has(selected) ? ui("feature_not_found") : ""}</p>
   <Photos key={`${selected}-${include}`} photos={filtered} />
  </section>
 </div>;
}
