
import { getUi } from "@/lib/site-text-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, morphology } from "@/lib/data";
import { GalleryExplorer } from "@/components/gallery-explorer";
export async function generateStaticParams() {
  return (await morphology()).nodes.map((n) => ({
    morphologyId: n.morphology_id,
  }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ morphologyId: string }>;
}) {
  const ui = await getUi();
  const { morphologyId } = await params;
  const [m, taxa] = await Promise.all([morphology(), catalog()]);
  const n = m.nodes.find((n) => n.morphology_id === morphologyId);
  if (!n) notFound();
  const t = m.terms.find((t) => t.term_id === n.term_id);
  return (
    <>
      <div className="page-heading">
        <Link href="/morphology">{ui("morphology_tree")}</Link>
        <p className="eyebrow">
          {n.morphology_id}{ui("term")}{n.term_id}
        </p>
        <h1>{t?.english}</h1>
        <p>
          {t?.korean} · {n.context_label}
        </p>
        <p>{t?.definition || ui("no_definition_recorded")}</p>
      </div>
      <GalleryExplorer
        taxa={taxa}
        morph={{ nodes: m.nodes, terms: m.terms }}
        initialNode={morphologyId}
      />
    </>
  );
}
