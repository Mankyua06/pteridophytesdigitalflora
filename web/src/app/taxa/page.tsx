
import { getUi } from "@/lib/site-text-server";
import { catalog, searchIndex } from "@/lib/data";
import { TaxonExplorer } from "@/components/taxon-explorer";
export async function generateMetadata() {
 const ui = await getUi();
 return { title: ui("taxa") };
}
export default async function Page() {
  const ui = await getUi();
  const [taxa, entries] = await Promise.all([catalog(), searchIndex()]);
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">TAXONOMIC CATALOG</span>
        <h1>{ui("taxa")}</h1>
        <p>{ui("search_by_scientific_name_korean_name_or_synonym_or_browse_by_or")}</p>
      </div>
      <TaxonExplorer taxa={taxa} entries={entries} />
    </>
  );
}
