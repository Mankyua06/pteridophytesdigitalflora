import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { validId } from "./image-url";
import type { Taxon, MorphData, SearchEntry, TaxonDetail, Contributor } from "./types";

const root = path.join(process.cwd(), "public/data");
async function read<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(root, file), "utf8")) as T;
}
export const catalog = cache(
  async () => (await read<{ taxa: Taxon[] }>("catalog.json")).taxa,
);
export const morphology = cache(() => read<MorphData>("morphology.json"));
export const searchIndex = cache(
  async () =>
    (await read<{ entries: SearchEntry[] }>("search-index.json")).entries,
);
export const taxonDetail = cache(
  async (id: string): Promise<TaxonDetail | null> => {
    if (!validId(id) || !(await catalog()).some((t) => t.taxon_id === id))
      return null;
    return read<TaxonDetail>(`taxa/${id}.json`);
  },
);

export const contributors = cache(async () => (await read<{contributors: Contributor[]}>("contributors.json")).contributors);
