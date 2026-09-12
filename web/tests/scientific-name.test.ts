import assert from "node:assert/strict";
import { test } from "node:test";
import { plainScientificName, scientificNameParts } from "../src/lib/scientific-name";

test("rank and authors remain upright between italic sections", () => {
  const name = "[i]Genus species[/i] Author var. [i]epithet[/i] Author";
  assert.equal(plainScientificName(name), "Genus species Author var. epithet Author");
  assert.deepEqual(scientificNameParts(name), [
    {text: "Genus species", italic: true},
    {text: " Author var. ", italic: false},
    {text: "epithet", italic: true},
    {text: " Author", italic: false},
  ]);
  assert.deepEqual(scientificNameParts("Unmarked name"), [{text: "Unmarked name", italic: false}]);
});
