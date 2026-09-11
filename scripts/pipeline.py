from .build_images import build as images
from .build_json import build as public
from .build_json import validate_public
from .common import Context, Report, parser
from .upload_images import upload
from .validate import validate_derived, validate_source
from .verify_storage import verify


def main():
    p = parser("로컬 검증 → WebP → JSON. 업로드는 명시적 옵션으로만 실행")
    p.add_argument("--mode", choices=["normal", "rebuild"], default="normal")
    p.add_argument("--image-id")
    p.add_argument("--upload", action="store_true")
    p.add_argument("--replace-changed", action="store_true")
    args = p.parse_args()
    ctx = Context(args.root)
    stages = [
        ("source", lambda r: validate_source(ctx, r)),
        ("images", lambda r: images(ctx, r, args.mode, args.image_id)),
        ("derived", lambda r: validate_derived(ctx, r)),
        ("json", lambda r: public(ctx, r)),
        ("public", lambda r: validate_public(ctx, r)),
    ]
    if args.upload:
        stages += [
            ("upload", lambda r: upload(ctx, r, replace_changed=args.replace_changed)),
            ("remote", lambda r: verify(ctx, r)),
        ]
    for stage, run in stages:
        report = Report(ctx, stage)
        try:
            run(report)
        except Exception as exc:
            report.add("error", "STAGE_FAILED", f"단계 실행 실패 ({type(exc).__name__})")
        report.finish()
        if not report.ok:
            raise SystemExit(1)


if __name__ == "__main__":
    main()
