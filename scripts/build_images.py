import io
import os
import tempfile
from pathlib import Path

from PIL import Image, ImageCms, ImageOps

from .common import atomic_json, cli, digest, read_json, safe_path, sha
from .validate import inspect_webp, validate_source


def build(ctx, report, mode="normal", image_id=None):
    data = validate_source(ctx, report)
    if not report.ok:
        return
    rows = [r for r in data["06_Images"] if image_id is None or r["image_id"] == image_id]
    if image_id and not rows:
        report.add("error", "UNKNOWN_IMAGE", "등록되지 않은 image-id입니다.", record_id=image_id)
        return
    manifest = read_json(ctx.state, {})
    settings = digest(ctx.settings())
    for row in rows:
        ident = row["image_id"]
        source = safe_path(ctx.originals, row["original_filename"])
        source_hash = sha(source)
        previous = manifest.get(ident)
        planned = []
        invalid = False
        if (
            mode == "normal"
            and previous
            and (
                previous.get("source") != row["original_filename"]
                or previous.get("source_sha256") != source_hash
                or previous.get("settings") != settings
            )
        ):
            report.add("error", "STALE", "원본/설정 변경. --mode rebuild를 사용하세요.", record_id=ident)
            report.counts["failed"] += 1
            continue
        for size in ctx.config["sizes"]:
            path = safe_path(ctx.derived, f"{size}/{ident}.webp")
            if mode == "rebuild" or not path.exists():
                planned.append((size, path))
            else:
                try:
                    if previous is None or inspect_webp(path) != previous["outputs"].get(size):
                        raise ValueError("unknown or damaged")
                    report.counts["skipped"] += 1
                except Exception:
                    report.add(
                        "error",
                        "REBUILD_REQUIRED",
                        "손상되었거나 이력을 확인할 수 없는 기존 WebP",
                        path=str(path),
                    )
                    invalid = True
        if invalid:
            report.counts["failed"] += 1
            continue
        if not planned:
            continue
        staged = []
        try:
            with Image.open(source) as original:
                original.load()
                image = ImageOps.exif_transpose(original)
                profile = original.info.get("icc_profile")
                if profile:
                    try:
                        image = ImageCms.profileToProfile(
                            image,
                            ImageCms.ImageCmsProfile(io.BytesIO(profile)),
                            ImageCms.createProfile("sRGB"),
                            outputMode="RGB",
                        )
                    except Exception:
                        report.add(
                            "error",
                            "ICC_CONVERSION",
                            "sRGB 변환 실패. 색상 프로필을 확인하세요.",
                            record_id=ident,
                        )
                        continue
                image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
                image.info.clear()
                outputs = dict(previous.get("outputs", {})) if previous else {}
                for size, target in planned:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    fd, tmp = tempfile.mkstemp(dir=target.parent, suffix=".webp")
                    os.close(fd)
                    staged.append((Path(tmp), target))
                    derivative = image.copy()
                    limit = ctx.config["sizes"][size]
                    derivative.thumbnail((limit, limit), Image.Resampling.LANCZOS)
                    derivative.save(
                        tmp, format="WEBP", quality=ctx.config["quality"], method=ctx.config["method"]
                    )
                    outputs[size] = inspect_webp(Path(tmp))
                if sha(source) != source_hash:
                    raise ValueError("source changed during processing")
                for tmp, target in staged:
                    os.replace(tmp, target)
                    report.counts["generated"] += 1
                manifest[ident] = dict(
                    source=row["original_filename"],
                    source_sha256=source_hash,
                    settings=settings,
                    outputs=outputs,
                )
                atomic_json(ctx.state, manifest)
        except Exception:
            report.add(
                "error",
                "IMAGE_FAILED",
                "파일 처리 실패. 재실행 전 원본과 파생 파일을 확인하세요.",
                record_id=ident,
            )
            report.counts["failed"] += 1
        finally:
            for tmp, _ in staged:
                tmp.unlink(missing_ok=True)
    if not ctx.state.exists() and report.ok:
        atomic_json(ctx.state, manifest)


def configure(p):
    p.add_argument("--mode", choices=["normal", "rebuild"], default="normal")
    p.add_argument("--image-id")


if __name__ == "__main__":
    cli("images", configure, lambda c, r, a: build(c, r, a.mode, a.image_id))
