
import { getUi } from "@/lib/site-text-server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { taxonDetail, morphology } from "@/lib/data";
import { TaxonPhotos } from "@/components/taxon-photos";
export default async function Page({params}: {params: Promise<{taxonId: string}>}) {
  const ui = await getUi();
 const {taxonId} = await params;
 const [detail, morph] = await Promise.all([taxonDetail(taxonId), morphology()]);
 if (!detail) notFound();
 return <><h2>{ui("photos")}</h2><Suspense fallback={<p>{ui("loading_photographs")}</p>}><TaxonPhotos photos={detail.images} nodes={morph.nodes} terms={morph.terms} /></Suspense></>;
}
