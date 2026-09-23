export type Taxon = {
  taxon_id: string;
  scientific_name: string;
  holding_status?: "held" | null;
  korean_name: string | null;
  order: string | null;
  family: string | null;
  genus: string | null;
  taxon_rank: string;
  gbif_status: string | null;
  accepted_scientific_name: string | null;
  image_count?: number;
};
export type Variant = {
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  object_key: string;
};
export type ImageSize = "thumb" | "medium" | "large";
export type ImageLink = {
  image_id: string;
  morphology_id: string;
};
export type Photo = {
  image_id: string;
  taxon_id: string;
  cytotype_id: string | null;
  photographer: string | null;
  copyright: string | null;
  caption: string | null;
  collection_date: string | null;
  variants: Record<ImageSize, Variant>;
  morphology: ImageLink[];
};
export type MorphNode = {
  morphology_id: string;
  parent_id: string | null;
  term_id: string;
  display_order: number;
  context_label: string | null;
};
export type Term = {
  term_id: string;
  english: string;
  korean: string | null;
  definition: string | null;
  category: string;
};
export type MorphData = {
  nodes: MorphNode[];
  terms: Term[];
  links: ImageLink[];
};
export type MorphState = {
  taxon_id: string;
  morphology_id: string;
};
export type Cytotype = {
  cytotype_id: string;
  ploidy: string | null;
  chromosome_number: string | null;
  genome_size_pg: number | null;
  reproductive_mode: string | null;
};
export type TaxonDetail = {
  taxon: Taxon;
  images: Photo[];
  cytotypes: Cytotype[];
  morphology: MorphState[];
  synonyms: { name_id: string; name: string; name_type: string }[];
};
export type SearchEntry = { taxon_id: string; names: string[] };

export type Contributor = {
 contributor_id: string;
 affiliation: string | null;
 name: string;
 email: string | null;
 taxon_scope: string | null;
 role: string | null;
 researcher_type: "lead" | "researcher" | null;
 email_public: boolean | null;
 display_order: number | null;
};
