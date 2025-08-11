import os
import time
import shutil
import subprocess
from django.conf import settings
from specifyweb.celery_tasks import app
from django.db import connection
from specifyweb.notifications.models import Message
import json
import traceback
from django.utils import timezone
import gzip


# We need to estimate the size of the database for progress reporting
# (used only for the progress bar, not for correctness).
# Note: This is an estimate from INFORMATION_SCHEMA and might differ from the
# final dump size. In my testing it was pretty dang close to the final size.
def _estimate_db_size_bytes(db_name: str) -> int:
    """Return an estimated database size in bytes for the given schema.

    We sum DATA_LENGTH across all tables in the schema. This is fast and
    doesn't lock anything. If anything goes wrong, return 1 to avoid division
    by zero in progress calculations.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COALESCE(SUM(DATA_LENGTH),0) FROM information_schema.tables WHERE table_schema=%s",
                [db_name],
            )
            row = cursor.fetchone()
            total = int(row[0] or 0)
            return max(total, 1)
    except Exception:
        # Fallback to non-zero to avoid dividing by zero
        return 1


def _tail_has_dump_completed_marker(path: str, lines: int = 5) -> bool:
    """Return True if the last few lines contain the dump footer marker.

    mysqldump and mariadb-dump end successful dumps with a line like:
      "-- Dump completed on YYYY-MM-DD HH:MM:SS"
    This marker text is hardcoded in the tools (not localized), so checking for
    the substring "-- Dump completed" is reliable across locales.

    A dump can be very large — this reads only the last up to 64KB and examines
    the last N lines from that chunk.
    """
    try:
        with open(path, 'rb') as f:
            f.seek(0, os.SEEK_END)
            size = f.tell()
            to_read = min(size, 65536)  # read up to last 64KB
            f.seek(-to_read, os.SEEK_END)
            tail = f.read(to_read)
        tail_lines = tail.splitlines()[-lines:]
        tail_text = b"\n".join(tail_lines)
        return b"-- Dump completed" in tail_text
    except Exception:
        return False


@app.task(bind=True)
def backup_database_task(self, user_id: int | None = None):
    """Create a compressed SQL dump (.sql.gz) of the default database in the Depository directory.

    1) Discover DB connection settings and a writable output folder.
    2) Find a dump tool (prefer mysqldump, fall back to mariadb-dump).
    3) Build a safe dump command (single-transaction, quick streaming).
    4) Stream the dump to a file named <database>.sql, validate footer, then compress to <database>.sql.gz.
    5) Delete the uncompressed .sql.
    6) Notify the user with a "backup-succeeded" message (or "backup-failed" on error).
    """
    # 1) DB settings
    db = settings.DATABASES.get('default', {})
    db_name = db.get('NAME') or settings.DATABASE_NAME
    db_user = db.get('USER') or settings.MASTER_NAME
    db_password = db.get('PASSWORD') or settings.MASTER_PASSWORD
    db_host = db.get('HOST') or (settings.DATABASE_HOST or 'localhost')
    db_port = str(db.get('PORT') or (settings.DATABASE_PORT or 3306))

    # Writable depository
    deposit_dir = getattr(settings, 'DEPOSITORY_DIR', '/tmp')
    os.makedirs(deposit_dir, exist_ok=True)

    # 2) Locate dump binary (mysqldump preferred; mariadb-dump is fine too)
    dump_bin = shutil.which('mysqldump') or shutil.which('mariadb-dump')
    if not dump_bin:
        # No dump tool available — notify and abort
        if user_id is not None:
            try:
                Message.objects.create(user_id=user_id, content=json.dumps({
                    'type': 'backup-failed',
                    'reason': 'dump-binary-missing',
                    'traceback': None,
                    'timestamp': timezone.now().isoformat(),
                }))
            except Exception:
                pass
        raise RuntimeError('mysqldump/mariadb-dump not found in PATH')

    # 3) Build dump command
    # Flags explained:
    # --max_allowed_packet=2G: avoid failures on large rows/blobs during dump, see spdataset issues
    # --single-transaction: snapshot without locking tables so we don't interrupt users
    # --quick: stream rows as they are read (lower memory, faster start)
    # --skip-triggers: exclude triggers to keep dump lightweight/simpler
    cmd = [
        dump_bin,
        f'--user={db_user}',
        f'--host={db_host}',
        f'--port={db_port}',
        '--max_allowed_packet=2G',
        '--single-transaction',
        '--quick',
        '--skip-triggers',
        db_name,
    ]

    # 4) Output file — always the same name so users can grab the latest dump
    filename = f"{db_name}.sql"
    out_path = os.path.join(deposit_dir, filename)
    gz_path = out_path + '.gz'

    # Used only for progress reporting in the UI
    total_bytes = _estimate_db_size_bytes(db_name)

    # Pass password via env so it doesn't end up in process args :scared:
    env = {**os.environ, 'MYSQL_PWD': db_password or ''}

    try:
        with open(out_path, 'wb') as fh:
            proc = subprocess.Popen(cmd, stdout=fh, stderr=subprocess.PIPE, env=env)

            # 5) Poll progress once per second by checking the growing file size
            while True:
                ret = proc.poll()
                try:
                    current = os.path.getsize(out_path)
                except OSError:
                    current = 0
                try:
                    self.update_state(state='PROGRESS', meta={'current': current, 'total': total_bytes})
                except Exception:
                    # Ignore reporting errors
                    pass
                if ret is not None:
                    break
                time.sleep(1)

            stderr = proc.stderr.read().decode(errors='replace') if proc.stderr else ''
            if proc.returncode != 0:
                raise RuntimeError(stderr or 'dump failed')
        # Validate the uncompressed dump footer without loading the whole file
        if not _tail_has_dump_completed_marker(out_path):
            raise RuntimeError('dump footer missing ("-- Dump completed")')
        # Compress the dump to .sql.gz and remove the original .sql
        try:
            with open(out_path, 'rb') as src, gzip.open(gz_path, 'wb') as dst:
                while True:
                    chunk = src.read(1024 * 1024)
                    if not chunk:
                        break
                    dst.write(chunk)
        except Exception as ce:
            raise RuntimeError(f'compression failed: {ce}')
        os.remove(out_path)
    except Exception as e:
        # 6a) Notify failure
        ts = timezone.now().isoformat()
        if user_id is not None:
            try:
                Message.objects.create(user_id=user_id, content=json.dumps({
                    'type': 'backup-failed',
                    'exception': str(e),
                    'traceback': traceback.format_exc() if settings.DEBUG else None,
                    'timestamp': ts,
                }))
            except Exception:
                pass
        # Re-raise to surface in logs/monitoring
        raise

    # 6b) Notify success with file info
    size = os.path.getsize(gz_path) if os.path.exists(gz_path) else 0
    ts = timezone.now().isoformat()
    gz_filename = f"{db_name}.sql.gz"
    if user_id is not None:
        try:
            Message.objects.create(user_id=user_id, content=json.dumps({
                'type': 'backup-succeeded',
                'file': gz_filename,
                'size': size,
                'timestamp': ts,
            }))
        except Exception:
            pass

    return {'path': gz_path, 'filename': gz_filename, 'size': size, 'timestamp': ts}
