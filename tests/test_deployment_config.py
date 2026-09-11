"""Tests for deployment configuration in the Dockerfile.

Verifies that gunicorn is configured for efficiency:
- gthread worker class (threads instead of forked processes)
- Single worker process with multiple threads
- Periodic worker restart via max-requests (prevents memory leaks)

Also verifies the Celery worker recycle limit in specifyweb/celery_tasks.py.

References: #7880, #7859
"""

import json
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
DOCKERFILE = REPO_ROOT / "Dockerfile"
CELERY_TASKS = REPO_ROOT / "specifyweb" / "celery_tasks.py"


def _parse_gunicorn_cmd():
    """Extract gunicorn CMD arguments from the Dockerfile."""
    content = DOCKERFILE.read_text()
    # Match CMD ["ve/bin/gunicorn", ...] as a JSON array
    match = re.search(r'CMD\s+(\[.*?"specifyweb_wsgi".*?\])', content, re.DOTALL)
    assert match, "Could not find gunicorn CMD in Dockerfile"
    args = json.loads(match.group(1))
    # Drop the executable and the WSGI module, keep only flags
    assert args[0].endswith("gunicorn"), f"Expected gunicorn executable, got {args[0]}"
    return args[1:]  # everything after the executable


class TestGunicornConfig:
    """Verify gunicorn is configured for gthread workers with periodic restart."""

    @pytest.fixture(autouse=True)
    def gunicorn_args(self):
        self.args = _parse_gunicorn_cmd()

    def test_worker_class_is_gthread(self):
        assert "--worker-class" in self.args, "Missing --worker-class flag"
        idx = self.args.index("--worker-class")
        assert self.args[idx + 1] == "gthread", (
            f"Expected gthread worker class, got {self.args[idx + 1]}"
        )

    def test_single_worker_process(self):
        assert "-w" in self.args, "Missing -w (workers) flag"
        idx = self.args.index("-w")
        assert self.args[idx + 1] == "1", (
            f"Expected 1 worker process, got {self.args[idx + 1]}"
        )

    def test_max_requests_present(self):
        assert "--max-requests" in self.args, (
            "Missing --max-requests flag (needed for periodic worker restart)"
        )
        idx = self.args.index("--max-requests")
        value = int(self.args[idx + 1])
        assert value == 500, f"Expected --max-requests 500, got {value}"

    def test_max_requests_jitter_configured(self):
        assert "--max-requests-jitter" in self.args, (
            "Missing --max-requests-jitter flag "
            "(prevents all workers restarting at once)"
        )
        idx = self.args.index("--max-requests-jitter")
        value = int(self.args[idx + 1])
        assert value == 50, f"Expected --max-requests-jitter 50, got {value}"

    def test_threads_configured(self):
        assert "--threads" in self.args, "Missing --threads flag"
        idx = self.args.index("--threads")
        value = int(self.args[idx + 1])
        assert value == 5, f"Expected 5 threads, got {value}"


class TestCeleryConfig:
    """Verify the Celery worker recycle limit stays in place."""

    def test_worker_max_tasks_per_child(self):
        content = CELERY_TASKS.read_text()
        match = re.search(
            r"^app\.conf\.worker_max_tasks_per_child\s*=\s*(\d+)",
            content,
            re.MULTILINE,
        )
        assert match, (
            "worker_max_tasks_per_child is not set in celery_tasks.py "
            "(needed to recycle workers and prevent memory leaks)"
        )
        value = int(match.group(1))
        assert value == 100, f"Expected worker_max_tasks_per_child 100, got {value}"
