
import { getUi } from "@/lib/site-text-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { taxonDetail, morphology } from "@/lib/data";
export default async function Page({params}: {params: Promise<{taxonId: string}>}) {
  const ui = await getUi();
 const {taxonId} = await params;
 const [detail, morph] = await Promise.all([taxonDetail(taxonId), morphology()]);
 if (!detail) notFound();
 const nodes = new Map(morph.nodes.map(n => [n.morphology_id, n]));
 const terms = new Map(morph.terms.map(t => [t.term_id, t]));
 const sortedChildren = (parentId: string | null) => morph.nodes
   .filter((node) => node.parent_id === parentId)
   .sort((a, b) => a.display_order - b.display_order || a.morphology_id.localeCompare(b.morphology_id));
 const morphologyOrder = new Map<string, number>();
 const visit = (parentId: string | null) => {
   for (const node of sortedChildren(parentId)) {
     morphologyOrder.set(node.morphology_id, morphologyOrder.size);
     visit(node.morphology_id);
   }
 };
 visit(null);
 const orderedMorphology = [...detail.morphology].sort((a, b) =>
   (morphologyOrder.get(a.morphology_id) ?? Number.MAX_SAFE_INTEGER) -
   (morphologyOrder.get(b.morphology_id) ?? Number.MAX_SAFE_INTEGER)
 );
 const koreanPath = (morphologyId: string) => {
   const labels: string[] = [];
   const visited = new Set<string>();
   let node = nodes.get(morphologyId);
   while (node && !visited.has(node.morphology_id)) {
     visited.add(node.morphology_id);
     labels.unshift(terms.get(node.term_id)?.korean || terms.get(node.term_id)?.english || node.morphology_id);
     node = node.parent_id ? nodes.get(node.parent_id) : undefined;
   }
   return labels.join(" > ");
 };
 const englishPath = (morphologyId: string) => {
   const labels: string[] = [];
   const visited = new Set<string>();
   let node = nodes.get(morphologyId);
   while (node && !visited.has(node.morphology_id)) {
     visited.add(node.morphology_id);
     labels.unshift(terms.get(node.term_id)?.english || node.context_label || node.morphology_id);
     node = node.parent_id ? nodes.get(node.parent_id) : undefined;
   }
   return labels.join(" > ");
 };
 return <>      <section>
        <h2>{ui("morphology_and_documentation")}</h2>
        <p className="muted">{ui("morphology_photo_availability")}</p>
        {detail.morphology.length ? (
          <div className="state-list">
            {orderedMorphology.map((m) => {
              const node = nodes.get(m.morphology_id);
              const term = terms.get(node?.term_id || "");
              return (
                <div key={m.morphology_id}>
                  <Link className="morphology-status-name" href={`/morphology/${m.morphology_id}`}>
                    <span>{englishPath(m.morphology_id) || term?.english || m.morphology_id}</span>
                    <small lang="ko">{koreanPath(m.morphology_id)}</small>
                  </Link>
                  <span>{ui("photo_count", {count: detail.images.filter(p => p.morphology.some(l => l.morphology_id === m.morphology_id)).length})}</span>
                  {detail.images.some(p => p.morphology.some(l => l.morphology_id === m.morphology_id)) ? <Link href={`/taxa/${taxonId}/photos?node=${m.morphology_id}&include=false`}>{ui("view_photos")}</Link> : <span className="muted">{ui("no_photographs_recorded")}</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty">{ui("morphological_status_has_not_been_recorded")}</p>
        )}
      </section>
</>;
}
