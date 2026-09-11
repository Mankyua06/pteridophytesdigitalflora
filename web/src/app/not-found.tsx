
import { getUi } from "@/lib/site-text-server";
import Link from "next/link";
export default async function NotFound() {
  const ui = await getUi();
  return (
    <div className="empty">
      <h1>{ui("record_not_found")}</h1>
      <p>{ui("check_the_taxon_or_morphology_id")}</p>
      <Link href="/taxa">{ui("browse_taxa")}</Link>
    </div>
  );
}
