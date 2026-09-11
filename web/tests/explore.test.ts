import assert from "node:assert/strict";
import test from "node:test";
import { imageUrl } from "../src/lib/image-url";
import { descendants, orderedPhotos, searchTaxa, photoTreeNodes } from "../src/lib/explore";
import type { MorphNode, Photo, Taxon } from "../src/lib/types";

test("image URL validates every path component and supports missing environment", () => {
  assert.equal(
    imageUrl("IM000001", "thumb", "https://test.supabase.co", "fern-images"),
    "https://test.supabase.co/storage/v1/object/public/fern-images/thumb/IM000001.webp",
  );
  assert.equal(imageUrl("IM000001", "thumb", ""), null);
  for (const id of ["../file", "a/b", "a?b", "a%2fb"])
    assert.throws(() => imageUrl(id, "thumb", "https://test.supabase.co"));
  assert.throws(() =>
    imageUrl("IM1", "thumb", "https://test.supabase.co/other"),
  );
  assert.throws(() =>
    imageUrl("IM1", "thumb", "https://test.supabase.co", "../bucket"),
  );
});
test("synonym search resolves to linked taxon", () => {
  const taxa = [{ taxon_id: "TX1" }, { taxon_id: "TX2" }] as Taxon[];
  assert.deepEqual(
    searchTaxa(
      taxa,
      [{ taxon_id: "TX1", names: ["Synthetic synonym", "합성 이름"] }],
      "SYNONYM",
    ),
    [taxa[0]],
  );
  assert.deepEqual(
    searchTaxa(taxa, [{ taxon_id: "TX1", names: ["합성 이름"] }], "합성"),
    [taxa[0]],
  );
});
test("parent filter is explicit and terminates even on malformed cycle", () => {
  const nodes = [
    { morphology_id: "MO1", parent_id: null },
    { morphology_id: "MO2", parent_id: "MO1" },
  ] as MorphNode[];
  assert.deepEqual([...descendants(nodes, "MO1", true)], ["MO1", "MO2"]);
  assert.deepEqual([...descendants(nodes, "MO1", false)], ["MO1"]);
});
test("photo deduplication and representative ordering", () => {
  const p = (id: string, rep: boolean, order: number) =>
    ({
      image_id: id,
      morphology: [
        { morphology_id: "MO1", representative: rep, display_order: order },
      ],
    }) as Photo;
  const a = p("IM1", false, 0),
    b = p("IM2", true, 4);
  assert.deepEqual(
    orderedPhotos([a, b, a], new Set(["MO1"])).map((p) => p.image_id),
    ["IM2", "IM1"],
  );
});

test("photo tree preserves ancestors, hides empty branches and handles unlinked photos", () => {
 const nodes = [
 {morphology_id:"root", parent_id:null},
 {morphology_id:"child", parent_id:"root"},
 {morphology_id:"empty", parent_id:"root"},
 {morphology_id:"other", parent_id:null},
 ] as MorphNode[];
 const photos = [{image_id:"IM1", morphology:[{morphology_id:"child"}]}, {image_id:"IM2", morphology:[]}] as Photo[];
 assert.deepEqual(photoTreeNodes(nodes, photos).map(n=>n.morphology_id), ["root", "child"]);
 assert.deepEqual(photoTreeNodes(nodes, []), []);
 assert.equal(orderedPhotos(photos).length, 2);
});
