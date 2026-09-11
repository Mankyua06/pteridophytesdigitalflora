
import { getUi } from "@/lib/site-text-server";
import { contributors } from "@/lib/data";
export async function generateMetadata() {
 const ui = await getUi();
 return { title: ui("contributors") };
}
export default async function Page() {
  const ui = await getUi();
 const people = await contributors();
 const leads = people.filter(person => person.researcher_type === "lead");
 const researchers = people.filter(person => person.researcher_type !== "lead");
 return <>
  <div className="page-heading"><span className="eyebrow">{ui("contributors_157")}</span><h1>{ui("building_the_flora_together")}</h1><p>{ui("meet_the_contributors_documenting_taxa_morphology_and_photograph")}</p></div>
  {people.length ? [{id:"lead-researchers",title:"lead_researchers",members:leads},{id:"researchers",title:"researchers",members:researchers}].map(group => group.members.length > 0 && <section className="contributor-section" key={group.id} aria-labelledby={group.id}>
   <h2 id={group.id}>{ui(group.title)}</h2>
   <div className="contributor-grid">{group.members.map(person => <article className="contributor-card" id={`contributor-${person.contributor_id}`} key={person.contributor_id}>
   <h3>{person.name}</h3>
   {person.affiliation && <p className="muted">{person.affiliation}</p>}
   <dl>{person.role && <><dt>{ui("contribution")}</dt><dd>{person.role}</dd></>}{person.taxon_scope && <><dt>{ui("taxonomic_scope")}</dt><dd>{person.taxon_scope}</dd></>}</dl>
   {person.email_public && person.email && <a href={`mailto:${encodeURIComponent(person.email)}`}>{person.email}</a>}
  </article>)}</div></section>) : <p className="empty">{ui("contributor_information_is_being_prepared")}</p>}
  <section className="contributor-invitation" aria-labelledby="join-the-flora">
   <h2 id="join-the-flora">{ui("join_the_flora")}</h2>
   <p>{ui("contributor_invitation")}</p>
   {leads.length > 0 && <ul className="lead-contacts">{leads.map(person => <li key={person.contributor_id}>
    <a href={`#contributor-${person.contributor_id}`}>{person.name}</a>
    {person.email_public && person.email && <> · <a href={`mailto:${encodeURIComponent(person.email)}`}>{person.email}</a></>}
   </li>)}</ul>}
  </section>
 </>;
}
