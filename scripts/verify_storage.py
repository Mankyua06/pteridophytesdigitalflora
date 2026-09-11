import hashlib

from .common import atomic_json, cli, digest
from .upload_images import Storage, StorageConfigError, environment, preflight, retry


def verify(ctx, report, storage=None, target=None):
    release, files = preflight(ctx, report)
    if not report.ok:
        return
    if target is None:
        try:
            url, bucket, key = environment(ctx)
        except StorageConfigError as error:
            report.add("error", "STORAGE_CONFIG", str(error))
            return
        except ValueError:
            report.add("error", "STORAGE_CONFIG", "원격 검증 환경변수가 없습니다.")
            return
    else:
        url, bucket = target
        key = None
    try:
        storage = storage or Storage(url, bucket, key)
    except StorageConfigError as error:
        report.add("error", "STORAGE_CONFIG", str(error))
        return
    attempts = ctx.config["retries"]
    remote = retry(storage.list_all, attempts)
    for object_key, info in sorted(files.items()):
        report.counts["checks"] += 1
        try:
            if object_key not in remote:
                raise ValueError("missing remote object")
            content = retry(lambda: storage.download(object_key), attempts)
            if hashlib.sha256(content).hexdigest() != info["sha256"]:
                raise ValueError("hash mismatch")
        except Exception:
            report.add("error", "REMOTE_INVALID", "공개 객체 누락/내용 불일치/접근 실패", path=object_key)
    for orphan in sorted(remote - set(files)):
        report.add("warning", "REMOTE_ORPHAN", "공개 release 밖의 객체. 별도 삭제 검토 필요", path=orphan)
    if report.ok:
        atomic_json(
            ctx.root / ".state/remote" / (digest({"url": url, "bucket": bucket}) + ".json"),
            dict(
                release_id=release["release_id"],
                input_fingerprint=ctx.fingerprint(),
                target=url,
                bucket=bucket,
                run_id=report.run_id,
                verified=True,
            ),
        )


if __name__ == "__main__":
    cli("remote", lambda p: None, lambda c, r, a: verify(c, r))
