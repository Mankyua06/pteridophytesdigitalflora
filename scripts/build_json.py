import os
import re
import shutil
import tempfile
from pathlib import Path

from .common import ID_RE, atomic_json, cli, digest, read_json, safe_path, sha
from .site_text import resolve as resolve_site_text
from .validate import normalize, validate_derived, validate_source


def project(ctx, sheet, row):
    return {key: row.get(key) for key in ctx.allow[sheet]}


def assemble(ctx, data, manifest):
    taxa = sorted(data["01_Taxa"], key=lambda r: r["taxon_id"])
    images = sorted(data["06_Images"], key=lambda r: r["image_id"])
    public_ids = {r["image_id"] for r in images}
    links = sorted(
        (
            project(ctx, "07_Image_Morphology", r)
            for r in data["07_Image_Morphology"]
            if r["image_id"] in public_ids
        ),
        key=lambda r: (r["morphology_id"], r["image_id"]),
    )
    public_manifest = {
        r["image_id"]: {
            size: dict(info, object_key=f"{size}/{r['image_id']}.webp")
            for size, info in manifest[r["image_id"]]["outputs"].items()
        }
        for r in images
    }
    catalog = [
        dict(project(ctx, "01_Taxa", r), image_count=sum(i["taxon_id"] == r["taxon_id"] for i in images))
        for r in taxa
    ]
    contributors = []
    for row in sorted(data.get("09_Contributors", []), key=lambda r: (r.get("display_order") or 0, r["contributor_id"])):
        if row["status"] != "active":
            continue
        entry = project(ctx, "09_Contributors", row)
        # Non-public addresses never enter the public JSON, including page source.
        if row.get("email_public") is not True:
            entry["email"] = None
        contributors.append(entry)
    site_text = resolve_site_text(ctx, data.get("10_Site_Text", []))
    files = {
        "site-text.json": {"text": site_text, "text_ko": resolve_site_text(ctx, data.get("10_Site_Text", []), "ko")},
        "contributors.json": {"contributors": contributors},
        "catalog.json": {"taxa": catalog},
        "morphology.json": {
            "terms": sorted(
                [project(ctx, "03_Morphology_Terms", r) for r in data["03_Morphology_Terms"]],
                key=lambda r: r["term_id"],
            ),
            "nodes": sorted(
                [project(ctx, "04_Morphology_Tree", r) for r in data["04_Morphology_Tree"]],
                key=lambda r: (r["parent_id"] or "", r["display_order"], r["morphology_id"]),
            ),
            "links": links,
        },
        "image-manifest.json": {"images": public_manifest},
        "search-index.json": {
            "entries": [
                dict(
                    taxon_id=r["taxon_id"],
                    names=sorted(
                        set(
                            filter(
                                None,
                                [re.sub(r"\[/?i\]", "", value) if value else value for value in
                                 [r["scientific_name"], r["korean_name"]]
                                 + [s["name"] for s in data["08_Synonyms"] if s["taxon_id"] == r["taxon_id"]]],
                            )
                        )
                    ),
                )
                for r in taxa
            ]
        },
    }
    for taxon in taxa:
        ident = taxon["taxon_id"]
        taxon_images = [
            dict(
                project(ctx, "06_Images", r),
                variants=public_manifest[r["image_id"]],
                morphology=[link for link in links if link["image_id"] == r["image_id"]],
            )
            for r in images
            if r["taxon_id"] == ident
        ]
        files[f"taxa/{ident}.json"] = {
            "taxon": project(ctx, "01_Taxa", taxon),
            "images": taxon_images,
            "cytotypes": sorted(
                [project(ctx, "02_Cytotypes", r) for r in data["02_Cytotypes"] if r["taxon_id"] == ident],
                key=lambda r: r["cytotype_id"],
            ),
            "morphology": sorted(
                [
                    project(ctx, "05_Taxon_Morphology", r)
                    for r in data["05_Taxon_Morphology"]
                    if r["taxon_id"] == ident
                ],
                key=lambda r: r["morphology_id"],
            ),
            "synonyms": sorted(
                [project(ctx, "08_Synonyms", r) for r in data["08_Synonyms"] if r["taxon_id"] == ident],
                key=lambda r: r["name_id"],
            ),
        }
    release_id = digest(files)
    for content in files.values():
        content.update(schema_version=ctx.config["schema_version"], release_id=release_id)
    return files, release_id


def validate_public(ctx, report, directory=None):
    directory = Path(directory or ctx.public)
    try:
        release = read_json(directory / "release.json")
        if not release or release["schema_version"] != ctx.config["schema_version"]:
            raise ValueError("release missing/version")
        if set(release) != {"schema_version", "release_id", "files"}:
            raise ValueError("unexpected release fields")
        files = {}
        for path, expected in release["files"].items():
            actual = safe_path(directory, path)
            report.counts["checks"] += 1
            if sha(actual) != expected:
                raise ValueError("file fingerprint mismatch")
            files[path] = read_json(actual)
            if (
                files[path]["release_id"] != release["release_id"]
                or files[path]["schema_version"] != release["schema_version"]
            ):
                raise ValueError("mixed release")
        actual_paths = {
            p.relative_to(directory).as_posix() for p in directory.rglob("*.json") if p.name != "release.json"
        }
        if actual_paths != set(files):
            raise ValueError("unexpected/missing public files")
        payload = {
            path: {k: v for k, v in content.items() if k not in ("release_id", "schema_version")}
            for path, content in files.items()
        }
        if digest(payload) != release["release_id"]:
            raise ValueError("content release fingerprint")
        if not all(isinstance(k, str) and isinstance(v, str) for language in ("text", "text_ko") for k, v in files["site-text.json"][language].items()):
            raise ValueError("invalid site text")
        taxa = files["catalog.json"]["taxa"]
        ids = {t["taxon_id"] for t in taxa}
        terms = files["morphology.json"]["terms"]
        nodes = files["morphology.json"]["nodes"]
        term_ids, node_ids = {t["term_id"] for t in terms}, {n["morphology_id"] for n in nodes}
        images = files["image-manifest.json"]["images"]
        expected_files = {"catalog.json", "morphology.json", "image-manifest.json", "search-index.json", "contributors.json", "site-text.json"}
        expected_files.update(f"taxa/{ident}.json" for ident in ids)
        if set(files) != expected_files:
            raise ValueError("unexpected public payload files")
        top_fields = {
            "site-text.json": {"text", "text_ko"},
            "contributors.json": {"contributors"},
            "catalog.json": {"taxa"},
            "morphology.json": {"terms", "nodes", "links"},
            "image-manifest.json": {"images"},
            "search-index.json": {"entries"},
        }
        for path, content in files.items():
            expected = top_fields.get(path, {"taxon", "images", "cytotypes", "morphology", "synonyms"})
            if set(content) != expected | {"release_id", "schema_version"}:
                raise ValueError("unexpected public payload fields")
        if len(ids) != len(taxa) or len(term_ids) != len(terms) or len(node_ids) != len(nodes):
            raise ValueError("duplicate public IDs")

        def allowed(sheet, row, extra=()):
            if set(row) - set(ctx.allow[sheet]) - set(extra):
                raise ValueError("field not on allowlist")
            for field in ctx.schema[sheet]["required"]:
                if field in ctx.allow[sheet] and row.get(field) is None:
                    raise ValueError("required public field missing")
            for field, rule in ctx.schema[sheet]["columns"].items():
                if field in row:
                    normalize(row[field], rule)

        contributors = files["contributors.json"]["contributors"]
        if len({c["contributor_id"] for c in contributors}) != len(contributors):
            raise ValueError("duplicate contributor IDs")
        for contributor in contributors:
            allowed("09_Contributors", contributor)
            if contributor.get("email_public") is not True and contributor.get("email") is not None:
                raise ValueError("non-public email exposed")
        for t in taxa:
            allowed("01_Taxa", t, ("image_count",))
            if not ID_RE.fullmatch(t["taxon_id"]):
                raise ValueError("invalid ID")
            if t.get("accepted_taxon_id") and t["accepted_taxon_id"] not in ids:
                raise ValueError("accepted relation")
        for t in terms:
            allowed("03_Morphology_Terms", t)
        for n in nodes:
            allowed("04_Morphology_Tree", n)
            if n["term_id"] not in term_ids or (n["parent_id"] and n["parent_id"] not in node_ids):
                raise ValueError("tree relation")
        parents = {n["morphology_id"]: n["parent_id"] for n in nodes}
        for n in parents:
            seen = set()
            while n is not None:
                if n in seen:
                    raise ValueError("tree cycle")
                seen.add(n)
                n = parents[n]
        seen_images = set()
        for ident in ids:
            detail = files[f"taxa/{ident}.json"]
            allowed("01_Taxa", detail["taxon"])
            if detail["taxon"]["taxon_id"] != ident:
                raise ValueError("taxon mismatch")
            cy_ids = {c["cytotype_id"] for c in detail["cytotypes"]}
            for key, sheet in (
                ("cytotypes", "02_Cytotypes"),
                ("morphology", "05_Taxon_Morphology"),
                ("synonyms", "08_Synonyms"),
            ):
                for row in detail[key]:
                    allowed(sheet, row)
                    if row["taxon_id"] != ident or (
                        key == "morphology" and row["morphology_id"] not in node_ids
                    ):
                        raise ValueError("detail relation")
            for image in detail["images"]:
                allowed("06_Images", image, ("variants", "morphology"))
                image_id = image["image_id"]
                if image_id in seen_images or image["taxon_id"] != ident:
                    raise ValueError("image public relation")
                if image["cytotype_id"] and image["cytotype_id"] not in cy_ids:
                    raise ValueError("cytotype relation")
                if image["variants"] != images[image_id]:
                    raise ValueError("variants mismatch")
                expected_links = [
                    link for link in files["morphology.json"]["links"] if link["image_id"] == image_id
                ]
                if image["morphology"] != expected_links:
                    raise ValueError("detail image links mismatch")
                seen_images.add(image_id)
        if seen_images != set(images):
            raise ValueError("image manifest relation")
        for ident, variants in images.items():
            if not ID_RE.fullmatch(ident) or set(variants) != set(ctx.config["sizes"]):
                raise ValueError("image variants")
            for size, info in variants.items():
                if set(info) != {"sha256", "width", "height", "bytes", "object_key"}:
                    raise ValueError("unexpected variant fields")
                if (
                    info["object_key"] != f"{size}/{ident}.webp"
                    or min(info["width"], info["height"], info["bytes"]) <= 0
                ):
                    raise ValueError("object key or dimensions")
        for link in files["morphology.json"]["links"]:
            allowed("07_Image_Morphology", link)
            if link["image_id"] not in images or link["morphology_id"] not in node_ids:
                raise ValueError("image morphology relation")
        for entry in files["search-index.json"]["entries"]:
            if set(entry) != {"taxon_id", "names"} or entry["taxon_id"] not in ids:
                raise ValueError("search relation")
        if {e["taxon_id"] for e in files["search-index.json"]["entries"]} != ids:
            raise ValueError("missing search entry")
        return release
    except Exception:
        report.add("error", "PUBLIC_INVALID", "공개 JSON의 해시·허용 필드·관계·릴리스 검증 실패")
        return None


def write_release(ctx, report, files, release_id):
    ctx.public.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".data-", dir=ctx.public.parent))
    backup = ctx.public.parent / ".data-previous"
    try:
        for path, value in files.items():
            atomic_json(staging / path, value)
        atomic_json(
            staging / "release.json",
            dict(
                schema_version=ctx.config["schema_version"],
                release_id=release_id,
                files={path: sha(staging / path) for path in sorted(files)},
            ),
        )
        validate_public(ctx, report, staging)
        if not report.ok:
            return
        if backup.exists():
            raise ValueError("previous interrupted replacement: recovery required")
        if ctx.public.exists():
            os.replace(ctx.public, backup)
        try:
            os.replace(staging, ctx.public)
        except Exception:
            if backup.exists():
                os.replace(backup, ctx.public)
            raise
        if backup.exists():
            shutil.rmtree(backup)
        report.counts["generated"] += len(files) + 1
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def build(ctx, report):
    data = validate_source(ctx, report)
    if not report.ok:
        return
    manifest = validate_derived(ctx, report, data, active_only=True)
    if not report.ok:
        return
    files, release_id = assemble(ctx, data, manifest)
    if ctx.fingerprint() != report.fingerprint:
        report.add("error", "INPUT_CHANGED", "실행 중 입력이 변경되었습니다.")
        return
    write_release(ctx, report, files, release_id)
    if report.ok:
        atomic_json(
            ctx.root / ".state/release-source.json",
            dict(
                release_id=release_id,
                input_fingerprint=ctx.fingerprint(),
                manifest_sha256=sha(ctx.state) if ctx.state.exists() else None,
            ),
        )


if __name__ == "__main__":
    cli("json", lambda p: None, lambda c, r, a: build(c, r))
