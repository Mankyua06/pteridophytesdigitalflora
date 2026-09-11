
import { getUi } from "@/lib/site-text-server";
import Link from "next/link";
import { morphology } from "@/lib/data";
import type { MorphNode, Term } from "@/lib/types";
export async function generateMetadata() {
 const ui = await getUi();
 return { title: ui("morphology") };
}
async function Branch({
  parent,
  nodes,
  terms,
}: {
  parent: string | null;
  nodes: MorphNode[];
  terms: Map<string, Term>;
}) {
  const ui = await getUi();
  const children = nodes
    .filter((n) => n.parent_id === parent)
    .sort(
      (a, b) =>
        a.display_order - b.display_order ||
        a.morphology_id.localeCompare(b.morphology_id),
    );
  if (!children.length) return null;
  return (
    <ul>
      {children.map((n) => {
        const label = <>
            <strong>{terms.get(n.term_id)?.english}</strong>{" "}
            <span>{terms.get(n.term_id)?.korean}</span>
            <small>
              {n.morphology_id}{ui("term_25")}{n.term_id}
            </small>
          </>;
        const hasChildren = nodes.some(child => child.parent_id === n.morphology_id);
        return <li key={n.morphology_id}>
          {hasChildren ? <details data-morphology-id={n.morphology_id}>
            <summary>{label}</summary>
            <Link className="tree-node-link" href={`/morphology/${n.morphology_id}`}>
              {ui("view_photos")} · {n.morphology_id} →
            </Link>
            <Branch parent={n.morphology_id} nodes={nodes} terms={terms} />
          </details> : <Link href={`/morphology/${n.morphology_id}`}>{label}</Link>}
        </li>;
      })}
    </ul>
  );
}
export default async function Page() {
  const ui = await getUi();
  const m = await morphology();
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">{ui("morphology_atlas")}</span>
        <h1>{ui("morphology")}</h1>
        <p>{ui("explore_photographs_through_morphological_structures_a_term_may_")}</p>
      </div>
      {m.nodes.length ? (
        <div className="tree">
          <Branch
            parent={null}
            nodes={m.nodes}
            terms={new Map(m.terms.map((t) => [t.term_id, t]))}
          />
        </div>
      ) : (
        <div className="empty">{ui("the_morphology_tree_is_being_prepared")}</div>
      )}
    </>
  );
}
