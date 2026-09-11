# Statistics

The separate `/statistics` page is linked from the main navigation. The homepage no longer displays totals. Both languages are editable through `10_Site_Text`.

Totals show published taxa, morphology nodes, published photographs (unique image IDs), and morphology nodes with at least one published photograph.

Four donut charts show coverage for Orders, Families, Genera, and Taxa, with counts and percentages. Denominators refer to this flora's published records, not a complete national inventory.

- Taxa are counted by unique `taxon_id`, including infraspecific ranks.
- A covered taxon has at least one published photograph linked to a valid morphology node.
- A covered order, family, or genus contains at least one covered taxon.
- Groups are distinct nonblank names in the corresponding classification field. Missing names are excluded, and affected taxa are reported under that chart.
- Unlinked photographs count in the photo total but do not establish morphological photo coverage.
- Selecting a feature counts only links directly to that node; descendants are excluded. The overview totals remain unchanged.
- A zero denominator displays a dash rather than an undefined percentage.
- Missing photos do not imply structural absence, and one photo does not imply complete documentation.

Statistics are calculated from validated public catalog and taxon detail JSON. New photos or classification changes appear after a successful `.venv/bin/python -m scripts.pipeline` refresh. No external GBIF request is involved.

Current local test photographs are arbitrarily assigned to TX000365. Charts demonstrate data coverage, not verified biological documentation.
