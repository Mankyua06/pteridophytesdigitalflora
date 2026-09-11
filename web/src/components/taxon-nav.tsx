"use client";
import { useUi } from "@/components/language-provider";

import Link from "next/link";
import { usePathname } from "next/navigation";
export function TaxonNav({taxonId}: {taxonId: string}) {
  const ui = useUi();
 const pathname = usePathname();
 return <nav className="view-tabs" aria-label={ui("taxon_sections")}>
  {[["", ui("overview")], ["/morphology", ui("morphology_documentation")], ["/photos", ui("photos")]].map(([suffix, label]) => {
   const href = `/taxa/${taxonId}${suffix}`;
   return <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>;
  })}
 </nav>;
}
