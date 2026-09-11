from .build_json import assemble, write_release
from .common import cli


def initialize(ctx, report):
    for name in (
        "images_original",
        "images_web/thumb",
        "images_web/medium",
        "images_web/large",
        ".state",
        "reports",
        "backups",
        "work",
    ):
        (ctx.root / name).mkdir(parents=True, exist_ok=True)
    if not (ctx.public / "release.json").exists():
        if ctx.public.exists() and any(ctx.public.iterdir()):
            report.add("error", "PUBLIC_NOT_EMPTY", "기존 공개 파일이 있어 빈 데이터로 덮어쓰지 않습니다.")
            return
        files, release_id = assemble(ctx, {s: [] for s in ctx.schema}, {})
        write_release(ctx, report, files, release_id)
        report.add(
            "info", "EMPTY_BOOTSTRAP", "웹앱 구동용 빈 공개 데이터. 현재 master 검증/발행 결과가 아닙니다."
        )


if __name__ == "__main__":
    cli("workspace", lambda p: None, lambda c, r, a: initialize(c, r))
