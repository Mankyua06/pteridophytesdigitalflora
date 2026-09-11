import base64
import hashlib
import json
import os
import re
import time
from urllib.parse import quote, urlsplit

import httpx
from dotenv import load_dotenv

from .build_json import validate_public
from .common import atomic_json, cli, digest, read_json, safe_path, sha
from .validate import validate_derived, validate_source


class StorageConfigError(ValueError):
    """Safe configuration message containing no credentials or server response."""


def validate_upload_key(key):
    if key.startswith("sb_secret_"):
        return
    if key.count(".") == 2:
        try:
            claims = json.loads(base64.urlsafe_b64decode(key.split(".")[1] + "==="))
            if claims.get("role") == "service_role":
                return
        except (ValueError, TypeError, AttributeError):
            pass
    raise StorageConfigError(
        "업로드에는 sb_secret_... 또는 legacy service_role 키가 필요합니다. "
        "루트 .env.local의 SUPABASE_SECRET_KEY를 확인하세요. publishable/anon 키는 사용할 수 없습니다."
    )


def retry(operation, attempts=3):
    for attempt in range(attempts):
        try:
            return operation()
        except Exception:
            if attempt == attempts - 1:
                raise
            time.sleep(min(0.25 * 2**attempt, 2))


def environment(ctx, need_key=True):
    load_dotenv(ctx.root / ".env.local", override=False)
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "fern-images")
    parts = urlsplit(url)
    if (
        parts.scheme != "https"
        or not parts.hostname
        or parts.username
        or parts.password
        or parts.path not in ("", "/")
        or parts.query
        or parts.fragment
    ):
        raise ValueError("SUPABASE_URL must be an HTTPS origin")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", bucket):
        raise ValueError("invalid bucket")
    key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if need_key and not key:
        raise ValueError("SUPABASE_SECRET_KEY missing")
    if key:
        validate_upload_key(key)
    return url, bucket, key


class Storage:
    def __init__(self, url, bucket, key):
        from supabase import create_client

        self.url, self.bucket = url, bucket
        client = create_client(url, key).storage
        try:
            info = client.get_bucket(bucket)
        except Exception:
            raise StorageConfigError(
                "bucket 접근 실패: Project URL, secret key, bucket 이름과 bucket 존재 여부를 확인하세요."
            ) from None
        if not info.public:
            raise StorageConfigError("이 웹사이트에는 public bucket이 필요합니다. Storage에서 Public 설정을 확인하세요.")
        self.api = client.from_(bucket)

    def list_all(self):
        found, queue = set(), [""]
        while queue:
            prefix = queue.pop()
            offset = 0
            while True:
                page = self.api.list(
                    prefix, {"limit": 100, "offset": offset, "sortBy": {"column": "name", "order": "asc"}}
                )
                for item in page:
                    name = item["name"]
                    if name in (".", "..") or "/" in name or "\\" in name:
                        raise ValueError("unsafe remote name")
                    path = f"{prefix}/{name}".lstrip("/")
                    if item.get("id") is None and item.get("metadata") is None:
                        queue.append(path)
                    else:
                        found.add(path)
                if len(page) < 100:
                    break
                offset += len(page)
        return found

    def download(self, key):
        # Public access verifies the same bytes delivered to the browser, not ETag assumptions.
        url = f"{self.url}/storage/v1/object/public/{quote(self.bucket, safe='')}/{quote(key, safe='/')}"
        with httpx.Client(timeout=60, follow_redirects=False) as client:
            response = client.get(url)
            response.raise_for_status()
            return response.content

    def upload(self, key, content, replace, cache_control):
        self.api.upload(
            key,
            content,
            {
                "content-type": "image/webp",
                "cache-control": str(cache_control),
                "upsert": "true" if replace else "false",
            },
        )


def preflight(ctx, report):
    if ctx.config.get("test_dataset", {}).get("enabled"):
        report.add(
            "error",
            "TEST_DATASET_LOCAL_ONLY",
            "임의 연결 테스트 자료입니다. 실제 자료로 검토·교체하기 전 원격 업로드하지 않습니다.",
        )
        return None, {}
    release = validate_public(ctx, report)
    if not report.ok:
        return None, {}
    stamp = read_json(ctx.root / ".state/release-source.json", {})
    if (
        stamp.get("release_id") != release["release_id"]
        or stamp.get("input_fingerprint") != ctx.fingerprint()
    ):
        report.add("error", "STALE_RELEASE", "Excel/설정과 공개 release가 다릅니다. JSON을 재생성하세요.")
        return None, {}
    data = validate_source(ctx, report)
    if report.ok:
        validate_derived(ctx, report, data, active_only=True)
    if not report.ok:
        return None, {}
    entries = read_json(ctx.public / "image-manifest.json")["images"]
    files = {info["object_key"]: info for variants in entries.values() for info in variants.values()}
    for key, info in files.items():
        if sha(safe_path(ctx.derived, key)) != info["sha256"]:
            report.add("error", "LOCAL_HASH_CHANGED", "업로드 직전 파일 해시가 release와 다릅니다.", path=key)
    return release, files


def upload(ctx, report, dry_run=False, replace_changed=False, storage=None, target=None):
    release, files = preflight(ctx, report)
    if not report.ok:
        return
    if target is None:
        try:
            url, bucket, key = environment(ctx, need_key=not dry_run)
        except StorageConfigError as error:
            report.add("error", "STORAGE_CONFIG", str(error))
            return
        except ValueError:
            if not dry_run:
                report.add("error", "STORAGE_CONFIG", "SUPABASE_URL/SECRET_KEY/BUCKET 설정이 필요합니다.")
                return
            report.add(
                "warning",
                "OFFLINE_DRY_RUN",
                "대상 미설정. 로컬 파일 계획만 검사하며 원격 비교는 수행하지 않습니다.",
            )
            print(f"target=미설정 files={len(files)} bytes={sum(x['bytes'] for x in files.values())}")
            return
    else:
        url, bucket = target
        key = None
    print(
        f"target={url} bucket={bucket} files={len(files)} bytes={sum(x['bytes'] for x in files.values())} dry_run={dry_run}"
    )
    if storage is None and dry_run and not key:
        report.add("warning", "REMOTE_NOT_COMPARED", "키 미설정. 원격 비교 없이 로컬 계획만 검증했습니다.")
        return
    try:
        storage = storage or Storage(url, bucket, key)
    except StorageConfigError as error:
        report.add("error", "STORAGE_CONFIG", str(error))
        return
    attempts = ctx.config["retries"]
    remote = retry(storage.list_all, attempts)
    for orphan in sorted(remote - set(files)):
        report.add(
            "warning",
            "REMOTE_ORPHAN",
            "release 밖의 공개 객체. hidden 전환 객체일 수 있으며 별도 삭제 검토 필요",
            path=orphan,
        )
    record_path = ctx.root / ".state/uploads" / (digest({"url": url, "bucket": bucket}) + ".json")
    recorded = read_json(record_path, {})
    for object_key, info in sorted(files.items()):
        try:
            report.counts["checks"] += 1
            exists = object_key in remote
            if exists:
                remote_hash = hashlib.sha256(
                    retry(lambda: storage.download(object_key), attempts)
                ).hexdigest()
                if remote_hash == info["sha256"]:
                    report.counts["skipped"] += 1
                    continue
                if not replace_changed:
                    report.add(
                        "warning" if dry_run else "error",
                        "REMOTE_CHANGED",
                        "기존 객체 내용이 다릅니다. 교체하려면 --replace-changed 필요",
                        path=object_key,
                    )
                    continue
            if dry_run:
                report.add(
                    "info",
                    "WOULD_REPLACE" if exists else "WOULD_UPLOAD",
                    "업로드 계획만 표시",
                    path=object_key,
                )
                continue
            content = safe_path(ctx.derived, object_key).read_bytes()
            if (
                hashlib.sha256(content).hexdigest() != info["sha256"]
                or ctx.fingerprint() != report.fingerprint
            ):
                raise ValueError("input changed")

            def transfer():
                # Reconcile a successful upload whose response was lost before retrying.
                if object_key in storage.list_all():
                    current = hashlib.sha256(storage.download(object_key)).hexdigest()
                    if current == info["sha256"]:
                        return
                    if not replace_changed:
                        raise ValueError("remote conflict")
                storage.upload(object_key, content, replace_changed, ctx.config["cache_control"])

            retry(transfer, attempts)
            if (
                hashlib.sha256(retry(lambda: storage.download(object_key), attempts)).hexdigest()
                != info["sha256"]
            ):
                raise ValueError("remote verification/cache delay")
            recorded[object_key] = info["sha256"]
            atomic_json(record_path, recorded)
            report.counts["generated"] += 1
        except Exception:
            report.counts["failed"] += 1
            report.add(
                "error",
                "UPLOAD_FAILED",
                "전송 또는 공개 다운로드 해시 검증 실패. 캐시 지연 확인 후 재실행하세요.",
                path=object_key,
            )


def configure(p):
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--replace-changed", action="store_true")


if __name__ == "__main__":
    cli("upload", configure, lambda c, r, a: upload(c, r, a.dry_run, a.replace_changed))
