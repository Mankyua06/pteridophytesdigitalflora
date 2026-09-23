
import { ScientificName } from "@/components/scientific-name";
import { getUi } from "@/lib/site-text-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { taxonDetail } from "@/lib/data";
export default async function Page({params}: {params: Promise<{taxonId: string}>}) {
  const ui = await getUi();
 const {taxonId} = await params;
 const detail = await taxonDetail(taxonId);
 if (!detail) notFound();
 const t = detail.taxon;
 const acceptedName = t.accepted_scientific_name?.trim()
   ? t.accepted_scientific_name
   : t.gbif_status?.trim().toUpperCase() === "ACCEPTED"
     ? t.scientific_name
     : ui("not_recorded");
 return <>      <div className="detail-grid">
        <section>
          <h2>{ui("taxonomic_information")}</h2>
          <dl>
            <dt>{ui("taxonomic_rank")}</dt>
            <dd>{t.taxon_rank}</dd>
            <dt>{ui("gbif_taxonomic_status")}</dt>
            <dd>{t.gbif_status || ui("not_recorded")}</dd>
            <dt>{ui("gbif_accepted_scientific_name")}</dt>
            <dd><ScientificName name={acceptedName} /></dd>
          </dl>
          <h3>{ui("synonyms")}</h3>
          {detail.synonyms.length ? (
            <ul>
              {detail.synonyms.map((s) => (
                <li key={s.name_id}><ScientificName name={s.name} /></li>
              ))}
            </ul>
          ) : (
            <p className="muted">{ui("no_synonyms_recorded")}</p>
          )}
        </section>
        <section>
          <h2>{ui("cytotype")}</h2>
          {detail.cytotypes.length ? (
            detail.cytotypes.map((c) => (
              <article key={c.cytotype_id}>
                <h3>{c.cytotype_id}</h3>
                <dl>
                  <dt>{ui("ploidy")}</dt>
                  <dd>{c.ploidy || ui("not_recorded")}</dd>
                  <dt>{ui("chromosome_number")}</dt>
                  <dd>{c.chromosome_number || ui("not_recorded")}</dd>
                  <dt>{ui("genome_size")}</dt>
                  <dd>
                    {c.genome_size_pg === null
                      ? ui("not_recorded")
                      : `${c.genome_size_pg} pg`}
                  </dd>
                  <dt>{ui("reproductive_mode")}</dt>
                  <dd>{c.reproductive_mode || ui("not_recorded")}</dd>
                </dl>
              </article>
            ))
          ) : (
            <p className="muted">{ui("no_cytotype_data_recorded")}</p>
          )}
        </section>
      </div>
</>;
}
