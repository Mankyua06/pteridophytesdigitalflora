from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import tempfile
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
ID_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_-]*$")


def canonical(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n").encode()


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def sha(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def read_json(path, default=None):
    return json.loads(Path(path).read_text()) if Path(path).exists() else default


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tmp-")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(canonical(value))
        os.replace(tmp, path)
    finally:
        Path(tmp).unlink(missing_ok=True)


def safe_path(base, relative):
    if not isinstance(relative, str) or not relative or "\\" in relative:
        raise ValueError("빈 경로 또는 역슬래시는 허용되지 않습니다")
    p = Path(relative)
    if p.is_absolute() or ".." in p.parts or re.match(r"^[A-Za-z]:", relative):
        raise ValueError("절대경로 및 .. 경로는 허용되지 않습니다")
    resolved = (Path(base) / p).resolve()
    if not resolved.is_relative_to(Path(base).resolve()):
        raise ValueError("심볼릭 링크가 지정된 루트 밖을 가리킵니다")
    return resolved


class Context:
    def __init__(self, root=ROOT):
        self.root = Path(root).resolve()
        self.config = yaml.safe_load((self.root / "config/pipeline.yaml").read_text())
        self.schema = yaml.safe_load((self.root / "config/schema.yaml").read_text())
        self.allow = yaml.safe_load((self.root / "config/public_fields.yaml").read_text())
        for key in ("master", "originals", "derived", "public"):
            setattr(self, key, safe_path(self.root, self.config[key]))
        self.state = self.root / ".state/image-manifest.json"

    def settings(self):
        from PIL import __version__

        return {
            **{k: self.config[k] for k in ("sizes", "quality", "method")},
            "pillow": __version__,
            "algorithm": "exif-srgb-strip-v1",
        }

    def fingerprint(self):
        return digest(
            {
                "master": sha(self.master) if self.master.exists() else None,
                "config": self.config,
                "schema": self.schema,
                "allow": self.allow,
                "site_text_defaults": read_json(self.root / "config/site_text.json", {}),
                "site_text_korean_defaults": read_json(self.root / "config/site_text_ko.json", {}),
            }
        )


class Report:
    def __init__(self, ctx, stage):
        self.ctx, self.stage = ctx, stage
        self.run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S") + "-" + uuid.uuid4().hex[:8]
        self.started = time.monotonic()
        self.issues = []
        self.counts = dict(checks=0, generated=0, skipped=0, failed=0)
        self.fingerprint = ctx.fingerprint()

    def add(self, severity, code, message, **location):
        self.issues.append(
            dict(
                run_id=self.run_id,
                stage=self.stage,
                severity=severity,
                code=code,
                sheet=location.get("sheet"),
                row=location.get("row"),
                column=location.get("column"),
                record_id=location.get("record_id"),
                path=location.get("path"),
                message=message,
                suggested_action=location.get("suggested_action", "보고서의 해당 입력을 확인하세요."),
            )
        )

    @property
    def ok(self):
        return not any(x["severity"] == "error" for x in self.issues)

    def finish(self, **extra):
        directory = self.ctx.root / "reports" / self.run_id
        directory.mkdir(parents=True, exist_ok=True)
        summary = dict(
            self.counts,
            errors=sum(x["severity"] == "error" for x in self.issues),
            warnings=sum(x["severity"] == "warning" for x in self.issues),
            elapsed_seconds=round(time.monotonic() - self.started, 3),
            input_fingerprint=self.fingerprint,
            success=self.ok,
        )
        result = dict(run_id=self.run_id, stage=self.stage, summary=summary, issues=self.issues, **extra)
        name = "validation" if self.stage in ("source", "derived", "public") else self.stage
        atomic_json(directory / f"{name}.json", result)
        lines = [
            f"# {self.stage} — {self.run_id}",
            "",
            f"결과: {'통과' if self.ok else '실패'}",
            "",
            "```json",
            canonical(summary).decode().strip(),
            "```",
            "",
        ]
        lines += [
            f"- **{i['severity']} / {i['code']}** {i['sheet'] or ''} {i['row'] or ''} "
            f"{i['column'] or ''}: {i['message']} ({i['path'] or ''})"
            for i in self.issues
        ]
        markdown = "\n".join(lines) + "\n"
        (directory / f"{name}.md").write_text(markdown)
        (directory / "summary.md").write_text(markdown)
        print(
            f"{self.stage}: {'PASS' if self.ok else 'FAIL'} "
            f"errors={summary['errors']} warnings={summary['warnings']} report={directory}"
        )
        return result


def parser(description):
    p = argparse.ArgumentParser(description=description)
    p.add_argument("--root", type=Path, default=ROOT, help="プロジェクトルート / 프로젝트 루트")
    return p


def cli(stage, configure, run):
    p = parser(stage)
    configure(p)
    args = p.parse_args()
    ctx = Context(args.root)
    report = Report(ctx, stage)
    try:
        run(ctx, report, args)
    except Exception as exc:
        # Do not log network exception text: SDK exceptions can contain credentials.
        report.add(
            "error", "COMMAND_FAILED", f"실행 실패 ({type(exc).__name__}). 입력과 로컬 설정을 확인하세요."
        )
    report.finish()
    raise SystemExit(0 if report.ok else 1)
