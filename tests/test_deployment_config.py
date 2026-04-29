"""Tests for deployment configuration in the Dockerfile.

Verifies that gunicorn is configured for efficiency:
- gthread worker class (threads instead of forked processes)
- Single worker process with multiple threads
- Periodic worker restart via max-requests (prevents memory leaks)

References: #7880, #7859
"""

import json
import re
from pathlib import Path

import pytest

DOCKERFILE = Path(__file__).resolve().parent.parent / "Dockerfile"


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
        assert value > 0, f"--max-requests must be positive, got {value}"

    def test_threads_configured(self):
        assert "--threads" in self.args, "Missing --threads flag"
        idx = self.args.index("--threads")
        value = int(self.args[idx + 1])
        assert value >= 2, f"Expected at least 2 threads, got {value}"
