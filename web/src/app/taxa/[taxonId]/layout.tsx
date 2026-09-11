
import { getUi } from "@/lib/site-text-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, taxonDetail } from "@/lib/data";
import { TaxonNav } from "@/components/taxon-nav";
export async function generateStaticParams() { return (await catalog()).map(t => ({taxonId: t.taxon_id})); }
export default async function Layout({children, params}: {children: React.ReactNode; params: Promise<{taxonId: string}>}) {
  const ui = await getUi();
 const {taxonId} = await params;
 const detail = await taxonDetail(taxonId);
 if (!detail) notFound();
 const t = detail.taxon;
 return <>
      <div className="page-heading">
        <Link href="/taxa">{ui("taxa_42")}</Link>
        <p className="eyebrow">
          {t.order} / {t.family} / {t.genus}
        </p>
        <h1>
          <i>{t.scientific_name}</i>
        </h1>
        <p>
          {t.korean_name || ui("no_korean_name_recorded")} <small>{t.taxon_id}</small>
        </p>
      </div>
      <TaxonNav taxonId={taxonId} />
{children}</>;
}
