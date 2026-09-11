
import { getUi } from "@/lib/site-text-server";
import Link from "next/link";
import Image from "next/image";
import { catalog, searchIndex } from "@/lib/data";
import { TaxonExplorer } from "@/components/taxon-explorer";
export default async function Home() {
  const ui = await getUi();
  const [taxa, entries] = await Promise.all([
    catalog(),
    searchIndex(),
  ]);
  return (
    <>
      <section className="hero">
        <div className="hero-headline">
        <div className="eyebrow">{ui("fern_digital_flora_31")}</div>
        <p className="flora-scope">{ui("korean_ferns")}</p>
        <h1>{ui("documenting_ferns")}<br />
          <em>{ui("exploring_their_forms")}</em>
        </h1>
        </div>
        <div className="hero-description">
        <p>{ui("from_plant_names_to_detailed_structures")}<br />{ui("explore_observations_through_taxa_morphology_and_photographs")}</p>
        <Link className="primary-link" href="/morphology">{ui("explore_morphology")}<span aria-hidden>↗</span>
        </Link>
        </div>
        <div className="hero-graphic hero-photo">
          <Image src="/backgrounds/coverimage.jpeg" alt={ui("flora_cover_photograph")} fill sizes="(max-width: 800px) 100vw, 45vw" loading="eager" unoptimized />
        </div>
      </section>
      <section className="section-heading">
        <span className="eyebrow">{ui("explore_the_flora")}</span>
        <h2>{ui("start_with_a_name")}</h2>
      </section>
      <TaxonExplorer taxa={taxa} entries={entries} />
    </>
  );
}
