import pytest
from PIL import Image

from scripts.build_images import build as images
from scripts.build_json import build as public
from scripts.build_json import validate_public
from scripts.common import Report, sha
from scripts.init_master import initialize
from scripts.validate import normalize, validate_source
from tests.conftest import append, change


def run(ctx, fn, *args, **kwargs):
    report = Report(ctx, "test")
    fn(ctx, report, *args, **kwargs)
    return report


def release(ctx):
    assert run(ctx, images).ok
    report = run(ctx, public)
    assert report.ok, report.issues


def test_valid(ctx):
    assert run(ctx, validate_source).ok


@pytest.mark.parametrize(
    "sheet,column,value,code",
    [
        ("01_Taxa", "taxon_id", "TX000002", "DUPLICATE_KEY"),
        ("06_Images", "taxon_id", "TX999", "FOREIGN_KEY"),
        ("04_Morphology_Tree", "parent_id", "MO0002", "TREE_CYCLE"),
        ("06_Images", "original_filename", "missing.jpg", "ORIGINAL_MISSING"),
        ("06_Images", "original_filename", "../escape.jpg", "UNSAFE_PATH"),
        ("04_Morphology_Tree", "display_order", -1, "INVALID_VALUE"),
        ("06_Images", "collection_date", "01/02/2026", "INVALID_VALUE"),
    ],
)
def test_invalid(ctx, sheet, column, value, code):
    change(ctx, sheet, column, value)
    report = run(ctx, validate_source)
    assert not report.ok
    assert code in {i["code"] for i in report.issues}


def test_cytotype(ctx):
    append(ctx, "02_Cytotypes", cytotype_id="CY0001", taxon_id="TX000002")
    change(ctx, "06_Images", "cytotype_id", "CY0001")
    assert "CYTOTYPE_TAXON" in {i["code"] for i in run(ctx, validate_source).issues}


def test_corrupt_and_symlink(ctx, tmp_path):
    (ctx.originals / "first.jpg").write_bytes(b"not an image")
    assert "ORIGINAL_DECODE" in {i["code"] for i in run(ctx, validate_source).issues}
    external = tmp_path / "outside.jpg"
    Image.new("RGB", (10, 10)).save(external)
    (ctx.originals / "escape.jpg").symlink_to(external)
    change(ctx, "06_Images", "original_filename", "escape.jpg")
    assert "UNSAFE_PATH" in {i["code"] for i in run(ctx, validate_source).issues}


def snapshot(ctx):
    return {
        p.relative_to(ctx.derived).as_posix(): (sha(p), p.stat().st_mtime_ns)
        for p in ctx.derived.rglob("*.webp")
    }


def test_incremental(ctx):
    first = run(ctx, images)
    assert first.ok and first.counts["generated"] == 6
    before = snapshot(ctx)
    second = run(ctx, images)
    assert second.ok and second.counts["skipped"] == 6
    assert snapshot(ctx) == before
    (ctx.derived / "thumb/IM000001.webp").unlink()
    third = run(ctx, images)
    assert third.ok and third.counts["generated"] == 1
    after = snapshot(ctx)
    assert all(after[k] == v for k, v in before.items() if k != "thumb/IM000001.webp")


def test_stale_and_target_rebuild(ctx):
    release(ctx)
    before = snapshot(ctx)
    Image.new("RGB", (450, 900), "red").save(ctx.originals / "first.jpg")
    stale = run(ctx, images)
    assert not stale.ok and snapshot(ctx) == before
    report = run(ctx, images, mode="rebuild", image_id="IM000001")
    assert report.ok and report.counts["generated"] == 3
    after = snapshot(ctx)
    assert all(after[k] == v for k, v in before.items() if "IM000002" in k)


def test_exif_no_upscale(ctx):
    exif = Image.Exif()
    exif[274] = 6
    Image.new("RGB", (80, 40)).save(ctx.originals / "first.jpg", exif=exif)
    assert run(ctx, images).ok
    for size in ("thumb", "medium", "large"):
        with Image.open(ctx.derived / size / "IM000001.webp") as image:
            assert image.size == (40, 80)
            assert not image.getexif()


def test_privacy_determinism(ctx):
    release(ctx)
    before = {str(p.relative_to(ctx.public)): p.read_bytes() for p in ctx.public.rglob("*.json")}
    all_text = b"".join(before.values())
    for forbidden in (
        b"DO_NOT_PUBLISH",
        b"SECRET_PRECISE_LOCALITY",
        b"original_filename",
        b"first.jpg",
    ):
        assert forbidden not in all_text
    assert b"Synthetic synonym" in all_text
    assert run(ctx, public).ok
    assert before == {str(p.relative_to(ctx.public)): p.read_bytes() for p in ctx.public.rglob("*.json")}
    assert run(ctx, validate_public).ok


@pytest.mark.parametrize("failure", ["source", "derived"])
def test_failed_build_preserves_release(ctx, failure):
    release(ctx)
    before = sha(ctx.public / "release.json")
    if failure == "source":
        change(ctx, "06_Images", "taxon_id", "TX_BAD")
    else:
        (ctx.derived / "medium/IM000001.webp").write_bytes(b"corrupt")
    assert not run(ctx, public).ok
    assert sha(ctx.public / "release.json") == before


def test_missing_history_blocks_normal(ctx):
    assert run(ctx, images).ok
    ctx.state.unlink()
    assert not run(ctx, images).ok
    assert run(ctx, images, mode="rebuild").ok


def test_master_never_overwritten(ctx):
    before = sha(ctx.master)
    assert not run(ctx, initialize).ok
    assert sha(ctx.master) == before


def test_date_and_id_normalization():
    assert normalize("TRUE", {"type": "boolean"}) is True
    assert normalize("2026-04-12", {"type": "date"}) == "2026-04-12"
    assert normalize("MT0001", {"type": "id"}) == "MT0001"
    with pytest.raises(ValueError):
        normalize(1, {"type": "id"})


def test_unregistered_original_not_generated(ctx):
    Image.new("RGB", (30, 30)).save(ctx.originals / "unregistered.jpg")
    report = run(ctx, images)
    assert report.ok and report.counts["generated"] == 6
    assert "UNREGISTERED_ORIGINAL" in {i["code"] for i in report.issues}


def test_formula_policy_and_source_only_first_run(ctx):
    change(ctx, "01_Taxa", "scientific_name", '=CONCAT("Fake", "name")')
    report = run(ctx, validate_source)
    assert not report.ok and "FORMULA" in {i["code"] for i in report.issues}
    assert "MANIFEST_MISSING" not in {i["code"] for i in report.issues}


def test_top_level_private_field_is_rejected(ctx):
    from scripts.build_json import write_release
    from scripts.common import digest, read_json

    release(ctx)
    before = sha(ctx.public / "release.json")
    files = {
        str(p.relative_to(ctx.public)): read_json(p)
        for p in ctx.public.rglob("*.json")
        if p.name != "release.json"
    }
    for content in files.values():
        content.pop("release_id")
        content.pop("schema_version")
    files["catalog.json"]["internal_note"] = "private"
    ident = digest(files)
    for content in files.values():
        content.update(release_id=ident, schema_version=1)
    assert not run(ctx, write_release, files, ident).ok
    assert sha(ctx.public / "release.json") == before
