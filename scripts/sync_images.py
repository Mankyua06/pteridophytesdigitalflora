"""Preview or transactionally synchronize originals, workbook and derivatives."""
import os
import shutil
import tempfile
from pathlib import Path

from openpyxl import load_workbook

from .build_images import build
from .common import Context, atomic_json, cli, read_json, safe_path, sha
from .register_images import EXTENSIONS, register, rows


def inventory(root):
    if not root.is_dir():
        raise ValueError("Originals directory is unavailable")
    result = {}
    for path in sorted(root.rglob("*")):
        if path.is_file() and not any(p.startswith(".") for p in path.relative_to(root).parts):
            rel = path.relative_to(root).as_posix()
            safe_path(root, rel)
            if path.suffix.lower() in EXTENSIONS:
                result[rel] = sha(path)
    if len({p.casefold() for p in result}) != len(result):
        raise ValueError("Case-colliding original filenames")
    return result


def sync(ctx, report, apply=False):
    lock = ctx.root / ".state/sync-images.lock"
    lock.parent.mkdir(exist_ok=True)
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        report.add("error", "SYNC_LOCKED", "Another sync is running; investigate a stale lock before removing it.")
        return
    os.close(fd)
    try:
        current = inventory(ctx.originals)
        master_hash = sha(ctx.master)
        registry_path = ctx.root / ".state/image-id-registry.json"
        state_hashes = {p: sha(p) if p.exists() else None for p in (registry_path, ctx.state)}
        history = read_json(registry_path, {"high_water": 0, "files": {}})
        manifest = read_json(ctx.state, {})
        wb = load_workbook(ctx.master)
        records = rows(wb["06_Images"])
        wb.close()
        if records and not current:
            raise ValueError("Originals folder contains no photos; refusing mass deletion")
        known = {r["original_filename"] for r in records}
        additions = set(current) - known
        actions = []
        missing = [r for r in records if r["original_filename"] not in current]
        old_hashes = {}
        for r in records:
            ident = r["image_id"]
            old = history["files"].get(ident, {})
            previous = manifest.get(ident, {})
            old_hashes[ident] = old.get("sha256") or previous.get("source_sha256")
        for r in records:
            ident, path = r["image_id"], r["original_filename"]
            fingerprint = old_hashes[ident]
            if path in current:
                if fingerprint and fingerprint != current[path]:
                    actions.append(dict(kind="replace", image_id=ident, old=path, new=path))
                continue
            if not fingerprint:
                raise ValueError(f"No previous fingerprint for missing photo {ident}; restore it before synchronizing")
            matches = [p for p in additions if current[p] == fingerprint]
            if len(matches) > 1 or (matches and sum(old_hashes[x['image_id']] == fingerprint for x in missing) > 1):
                raise ValueError(f"Ambiguous rename for {ident}; reconcile duplicate photos")
            if matches:
                new = matches[0]
                additions.remove(new)
                parts = Path(new).stem.split("_", 2)
                if len(parts) != 3 or parts[0] != r["taxon_id"] or not parts[2].strip():
                    raise ValueError(f"Renamed filename must retain taxon and use the naming convention: {new}")
                actions.append(dict(kind="rename", image_id=ident, old=path, new=new))
            else:
                actions.append(dict(kind="delete", image_id=ident, old=path, new=None))
        for path in sorted(additions):
            actions.append(dict(kind="add", image_id=None, old=None, new=path))
        for action in actions:
            report.add("info", "SYNC_" + action["kind"].upper(),
                       f"{action['old']} -> {action['new']}", record_id=action["image_id"])
        atomic_json(ctx.root / "reports" / report.run_id / "sync-plan.json", actions)
        (ctx.root / "work").mkdir(exist_ok=True)
        # Stage all workbook and image generation work. A failed stage never touches live data.
        with tempfile.TemporaryDirectory(prefix="flora-sync-", dir=ctx.root / "work") as directory:
            stage_root = Path(directory)
            shutil.copytree(ctx.root / "config", stage_root / "config")
            stage = Context(stage_root)
            stage.master.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ctx.master, stage.master)
            shutil.copytree(ctx.originals, stage.originals, copy_function=shutil.copy2)
            if ctx.derived.exists():
                shutil.copytree(ctx.derived, stage.derived)
            stage.state.parent.mkdir(parents=True, exist_ok=True)
            atomic_json(stage.state, manifest)
            staged_registry = stage_root / ".state/image-id-registry.json"
            atomic_json(staged_registry, history)
            book = load_workbook(stage.master)
            deleted = {a["image_id"] for a in actions if a["kind"] == "delete"}
            renamed = {a["image_id"]: a["new"] for a in actions if a["kind"] == "rename"}
            for name in ("06_Images", "07_Image_Morphology"):
                sheet = book[name]
                headers = [c.value for c in sheet[1]]
                id_col = headers.index("image_id") + 1
                for n in range(sheet.max_row, 1, -1):
                    ident = sheet.cell(n, id_col).value
                    if ident in deleted:
                        sheet.delete_rows(n)
                    elif name == "06_Images" and ident in renamed:
                        sheet.cell(n, headers.index("original_filename") + 1, renamed[ident])
            book.save(stage.master)
            book.close()
            # Changed sources are rebuilt; deleted derivatives remain only in the recovery backup.
            for action in actions:
                ident = action["image_id"]
                if ident:
                    manifest.pop(ident, None)
                    for size in ctx.config["sizes"]:
                        safe_path(stage.derived, f"{size}/{ident}.webp").unlink(missing_ok=True)
            atomic_json(stage.state, manifest)
            register(stage, report, apply=True)
            if not report.ok:
                return
            check = load_workbook(stage.master, read_only=True)
            remaining = rows(check["06_Images"])
            check.close()
            registered_paths = {r["original_filename"] for r in remaining}
            for action in actions:
                if action["kind"] == "add" and action["new"] not in registered_paths:
                    action["kind"] = "skip"
            atomic_json(ctx.root / "reports" / report.run_id / "sync-plan.json", actions)
            if records and not remaining:
                raise ValueError("No valid registered photographs would remain; refusing mass deletion")
            if not apply:
                report.add("info", "SYNC_PREVIEW", "Preview only; live workbook and images unchanged")
                return
            build(stage, report)
            if not report.ok:
                return
            if inventory(ctx.originals) != current or sha(ctx.master) != master_hash:
                raise ValueError("Originals or workbook changed during sync; retry")
            if any((sha(p) if p.exists() else None) != value for p, value in state_hashes.items()):
                raise ValueError("Image state changed during sync; do not run other pipeline commands concurrently")
            backup = ctx.root / "backups" / f"sync-{report.run_id}"
            backup.mkdir(parents=True)
            targets = [(ctx.master, stage.master), (ctx.derived, stage.derived),
                       (ctx.state, stage.state), (registry_path, staged_registry)]
            saved = []
            for index, (live, staged) in enumerate(targets):
                copy = backup / str(index)
                exists = live.exists()
                if exists:
                    if live.is_dir():
                        shutil.copytree(live, copy)
                    else:
                        shutil.copy2(live, copy)
                saved.append((live, staged, copy, exists))
            atomic_json(backup / "recovery.json", {
                "targets": [{"path": str(live), "backup": str(copy), "existed": exists}
                            for live, _, copy, exists in saved], "actions": actions})
            try:
                for live, staged, _, _ in saved:
                    live.parent.mkdir(parents=True, exist_ok=True)
                    if live.is_dir():
                        shutil.rmtree(live)
                    if staged.is_dir():
                        shutil.copytree(staged, live)
                    else:
                        shutil.copy2(staged, live)
            except Exception:
                for live, _, copy, exists in saved:
                    if live.is_dir():
                        shutil.rmtree(live)
                    elif live.exists():
                        live.unlink()
                    if exists:
                        if copy.is_dir():
                            shutil.copytree(copy, live)
                        else:
                            shutil.copy2(copy, live)
                raise
            report.add("info", "SYNC_APPLIED", "Synchronization complete; recovery backup", path=str(backup))
    except (ValueError, KeyError, OSError) as error:
        report.add("error", "SYNC_FAILED", str(error))
    finally:
        lock.unlink(missing_ok=True)


if __name__ == "__main__":
    cli("sync", lambda p: p.add_argument("--apply", action="store_true"),
        lambda c, r, a: sync(c, r, a.apply))
