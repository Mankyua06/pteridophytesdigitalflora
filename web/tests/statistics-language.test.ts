import test from "node:test";
import assert from "node:assert/strict";
import { coverage } from "../src/lib/statistics";
import { translator } from "../src/lib/site-text";
import type { Taxon } from "../src/lib/types";

test("coverage counts unique taxa and groups, exact features, and missing classifications", () => {
  const taxa = [
    {taxon_id:"A",order:"O",family:"F",genus:"G",taxon_rank:"SPECIES"},
    {taxon_id:"B",order:"O",family:"F",genus:"G",taxon_rank:"VARIETY"},
    {taxon_id:"C",order:"P",family:null,genus:null,taxon_rank:"SPECIES"},
  ] as Taxon[];
  const links = [{taxon_id:"A",morphology_id:"child"},{taxon_id:"A",morphology_id:"child"},{taxon_id:"B",morphology_id:"other"}];
  assert.deepEqual(coverage(taxa,links), [
    {rank:"order",total:2,covered:1,missing:0},
    {rank:"family",total:1,covered:1,missing:1},
    {rank:"genus",total:1,covered:1,missing:1},
    {rank:"taxa",total:3,covered:2,missing:0},
  ]);
  assert.equal(coverage(taxa,links,"child")[3].covered,1);
  assert.equal(coverage(taxa,links,"parent")[3].covered,0);
  assert.ok(coverage([],[]).every(row => row.total===0 && row.covered===0));
});
test("Korean text uses English fallback and substitutes full-sentence templates safely", () => {
  const source={text:{label:"Edited English",count:"Compare {count} taxa"},text_ko:{label:"  ",count:"{count}개 분류군 비교"}};
  assert.equal(translator("ko",source)("label"),"Edited English");
  assert.equal(translator("ko",source)("count",{count:3}),"3개 분류군 비교");
  assert.equal(translator("en",source)("count",{count:3}),"Compare 3 taxa");
});
