import { catalog, morphology, taxonDetail } from "@/lib/data";
import { getUi } from "@/lib/site-text-server";
import { Statistics } from "@/components/statistics";

export async function generateMetadata() {
  const ui = await getUi();
  return { title: ui("statistics") };
}
export default async function Page() {
  const ui = await getUi();
  const [taxa, morph] = await Promise.all([catalog(), morphology()]);
  const details = await Promise.all(taxa.filter(t => (t.image_count || 0) > 0).map(t => taxonDetail(t.taxon_id)));
  const photos = [...new Map(details.flatMap(d => d?.images || []).map(p => [p.image_id, p])).values()];
  const nodes = new Set(morph.nodes.map(n => n.morphology_id));
  const links = photos.flatMap(p => p.morphology.filter(l => nodes.has(l.morphology_id)).map(l => ({taxon_id: p.taxon_id, morphology_id: l.morphology_id})));
  return <>
    <div className="page-heading"><span className="eyebrow">{ui("korean_ferns")}</span><h1>{ui("statistics")}</h1><p>{ui("statistics_intro")}</p></div>
    <Statistics taxa={taxa} nodes={morph.nodes} terms={morph.terms} links={links} photoCount={photos.length} />
  </>;
}
