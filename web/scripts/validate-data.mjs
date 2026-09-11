import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = path.resolve("public/data");
const release = JSON.parse(
  fs.readFileSync(path.join(root, "release.json"), "utf8"),
);
if (release.schema_version !== 1 || !/^[a-f0-9]{64}$/.test(release.release_id))
  throw Error("Invalid release");
const files = {};
for (const [name, hash] of Object.entries(release.files)) {
  if (
    !/^(catalog|morphology|search-index|image-manifest|contributors|site-text)\.json$/.test(name) &&
    !/^taxa\/[A-Za-z][A-Za-z0-9_-]*\.json$/.test(name)
  )
    throw Error("Unexpected public path");
  const bytes = fs.readFileSync(path.join(root, name));
  if (crypto.createHash("sha256").update(bytes).digest("hex") !== hash)
    throw Error(`Fingerprint mismatch: ${name}`);
  const data = JSON.parse(bytes);
  if (data.release_id !== release.release_id || data.schema_version !== 1)
    throw Error("Mixed release");
  files[name] = data;
}
if (!files["contributors.json"]) throw Error("Missing contributors");
for (const person of files["contributors.json"].contributors) {
  if (person.email_public !== true && person.email !== null) throw Error("Non-public email exposed");
}
const ids = new Set(files["catalog.json"].taxa.map((t) => t.taxon_id));
const nodes = new Set(
  files["morphology.json"].nodes.map((n) => n.morphology_id),
);
const images = files["image-manifest.json"].images;
for (const id of ids)
  if (!files[`taxa/${id}.json`]) throw Error("Missing taxon detail");
for (const l of files["morphology.json"].links)
  if (!nodes.has(l.morphology_id) || !images[l.image_id])
    throw Error("Broken image relation");
for (const e of files["search-index.json"].entries)
  if (!ids.has(e.taxon_id)) throw Error("Broken search relation");
console.log(
  `Public JSON verified: ${ids.size} taxa, release ${release.release_id.slice(0, 12)}`,
);
