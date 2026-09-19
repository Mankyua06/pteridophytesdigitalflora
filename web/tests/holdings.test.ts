import assert from "node:assert/strict";
import { test } from "node:test";
import { holdingsCoverage } from "../src/lib/statistics";
import type { Taxon } from "../src/lib/types";

test("holdings and photo coverage use independent denominators", () => {
  const taxa = [
    { holding_status: "held", image_count: 3 },
    { holding_status: "held", image_count: 0 },
    { holding_status: null, image_count: 5 },
    { image_count: 0 },
  ] as Taxon[];
  assert.deepEqual(holdingsCoverage(taxa), {total: 4, held: 2, notHeld: 2, photographed: 1});
  assert.deepEqual(holdingsCoverage([]), {total: 0, held: 0, notHeld: 0, photographed: 0});
});
