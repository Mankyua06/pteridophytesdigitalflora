
import { getUi } from "@/lib/site-text-server";
import { Suspense } from "react";
import Link from "next/link";
import { catalog, morphology } from "@/lib/data";
import { PhotoComparison } from "@/components/photo-comparison";
export async function generateMetadata() {
 const ui = await getUi();
 return {title: ui("morphology_comparison")};
}
export default async function Page() {
  const ui = await getUi();
  const [taxa, morph] = await Promise.all([catalog(), morphology()]);
  return <>
    <div className="page-heading"><Link href="/gallery">{ui("photo_gallery")}</Link><h1>{ui("morphology_comparison")}</h1><p>{ui("compare_photographs_of_the_same_morphological_feature_across_tax")}</p></div>
    <Suspense fallback={<p>{ui("loading_comparison_tools")}</p>}><PhotoComparison taxa={taxa} morph={{nodes:morph.nodes,terms:morph.terms}} /></Suspense>
  </>;
}
