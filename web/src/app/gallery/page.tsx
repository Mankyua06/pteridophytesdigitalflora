
import { getUi } from "@/lib/site-text-server";
import { catalog, morphology } from "@/lib/data";
import { GalleryExplorer } from "@/components/gallery-explorer";
export async function generateMetadata() {
 const ui = await getUi();
 return { title: ui("photo_gallery_12") };
}
export default async function Page() {
  const ui = await getUi();
  const [taxa, morph] = await Promise.all([catalog(), morphology()]);
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">{ui("photographic_records")}</span>
        <h1>{ui("photo_gallery_12")}</h1>
        <p>{ui("select_a_taxon_and_a_morphological_feature_to_explore_photograph")}</p>
      </div>
      <GalleryExplorer
        taxa={taxa}
        morph={{ nodes: morph.nodes, terms: morph.terms }}
      />
    </>
  );
}
