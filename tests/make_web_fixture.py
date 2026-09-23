"""Synthetic, isolated browser test data. Never writes the real master or public JSON."""

import shutil
import sys

from PIL import Image

from scripts.build_images import build as images
from scripts.build_json import build as public
from scripts.common import ROOT, Context, Report
from scripts.init_master import initialize
from tests.conftest import append


def main():
    root = ROOT / "work/e2e-source"
    if root.exists():
        shutil.rmtree(root)
    shutil.copytree(ROOT / "config", root / "config")
    ctx = Context(root)
    initialize(ctx, Report(ctx, "fixture"))
    append(
        ctx,
        "01_Taxa",
        taxon_id="TX000001",
        scientific_name="Synthetic taxon A",
        taxon_rank="SPECIES",
        korean_name="합성 분류군",
        order="Synthetic order",
        family="Synthetic family",
        genus="Synthetic genus",
    )
    append(ctx, "03_Morphology_Terms", term_id="MT0001", english="Synthetic structure", korean="합성 용어", category="general")
    append(
        ctx,
        "04_Morphology_Tree",
        morphology_id="MO0001",
        term_id="MT0001",
        context_label="Synthetic root",
    )
    append(
        ctx,
        "04_Morphology_Tree",
        morphology_id="MO0002",
        parent_id="MO0001",
        term_id="MT0001",
        display_order=1,
        context_label="Synthetic child",
    )
    append(ctx, "04_Morphology_Tree", morphology_id="MO0003", term_id="MT0001", display_order=2, context_label="Empty branch")
    append(ctx, "01_Taxa", taxon_id="TX000002", scientific_name="Synthetic taxon B", taxon_rank="SPECIES")
    append(
        ctx,
        "08_Synonyms",
        name_id="NA0001",
        taxon_id="TX000001",
        name="Synthetic synonym",
        name_type="scientific_synonym",
    )
    append(ctx, "02_Cytotypes", cytotype_id="CY0001", taxon_id="TX000001", ploidy="synthetic expression")
    append(
        ctx,
        "05_Taxon_Morphology",
        taxon_id="TX000001",
        morphology_id="MO0001",
    )
    append(ctx, "01_Taxa", taxon_id="TX000003", scientific_name="Synthetic taxon C", taxon_rank="SPECIES")
    for index in range(1, 4):
        ident = f"IM{index:06}"
        Image.new("RGB", (600, 300), (20 * index, 100, 60)).save(ctx.originals / f"{ident}.jpg")
        append(
            ctx,
            "06_Images",
            image_id=ident,
            taxon_id="TX000001" if index < 3 else "TX000003",
            original_filename=f"{ident}.jpg",
            photographer="Synthetic photographer",
            copyright="Synthetic test only",
        )
        append(
            ctx,
            "07_Image_Morphology",
            image_id=ident,
            morphology_id="MO0002",
        )
    append(ctx, "09_Contributors", contributor_id="CT000001", name="Synthetic contributor", affiliation="Synthetic institution", email="visible@example.org", email_public=True, status="active", taxon_scope="Synthetic order", role="Photo contribution", display_order=1, researcher_type="lead")
    append(ctx, "09_Contributors", contributor_id="CT000002", name="Private contact contributor", email="hidden@example.org", email_public=False, status="active", display_order=2)
    append(ctx, "10_Site_Text", key="start_with_a_name", text="Edited in Excel")
    for fn in (images, public):
        report = Report(ctx, "fixture")
        fn(ctx, report)
        if not report.ok:
            report.finish()
            sys.exit(1)
    web = ROOT / "work/e2e-web"
    web.mkdir(exist_ok=True)
    for name in ("src", "public"):
        if (web / name).exists():
            shutil.rmtree(web / name)
        shutil.copytree(ROOT / "web" / name, web / name)
    shutil.rmtree(web / "public/data")
    shutil.copytree(ctx.public, web / "public/data")
    for name in ("package.json", "tsconfig.json", "next.config.ts", "next-env.d.ts"):
        shutil.copy2(ROOT / "web" / name, web / name)
    if not (web / "node_modules").exists():
        (web / "node_modules").symlink_to(ROOT / "web/node_modules", target_is_directory=True)
    # Public test-only endpoint; no keys, network writes or real records.
    (web / ".env.local").write_text("NEXT_PUBLIC_SUPABASE_URL=https://synthetic.supabase.co\n")


if __name__ == "__main__":
    main()
