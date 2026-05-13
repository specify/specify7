import json
import re
from pathlib import Path


def detect_node():
    # Search for package.json files recursively
    for pkg in Path(".").rglob("package.json"):
        try:
            data = json.loads(pkg.read_text())
            engines = data.get("engines", {})
            node = engines.get("node")

            if not node:
                continue

            m = re.search(r"(\d+)", node)
            if m:
                return m.group(1)
        except (json.JSONDecodeError, OSError, ValueError):
            continue

    return None


def detect_python():
    # Try pyproject.toml
    pyproject = Path("pyproject.toml")
    if pyproject.exists():
        try:
            content = pyproject.read_text()
            # Look for requires-python in pyproject.toml
            match = re.search(r'requires-python\s*=\s*["\']([^"\']+)["\']', content)
            if match:
                version_spec = match.group(1)
                # Extract X.Y format from version specs like ">=3.12" or "^3.12"
                version_match = re.search(r"(\d+)\.(\d+)", version_spec)
                if version_match:
                    return f"{version_match.group(1)}.{version_match.group(2)}"
        except (OSError, ValueError):
            pass

    # Try .python-version
    python_version = Path(".python-version")
    if python_version.exists():
        try:
            content = python_version.read_text().strip()
            # Extract X.Y format
            match = re.search(r"^(\d+)\.(\d+)", content)
            if match:
                return f"{match.group(1)}.{match.group(2)}"
        except OSError:
            pass

    # Try runtime.txt
    runtime = Path("runtime.txt")
    if runtime.exists():
        try:
            content = runtime.read_text().strip()
            # Look for python-X.Y pattern
            match = re.search(r"python-(\d+)\.(\d+)", content)
            if match:
                return f"{match.group(1)}.{match.group(2)}"
        except OSError:
            pass

    # Try GitHub Actions workflows
    workflows_dir = Path(".github/workflows")
    if workflows_dir.exists():
        try:
            for workflow in workflows_dir.glob("*.yml"):
                try:
                    content = workflow.read_text()
                    # Look for setup-python with python-version
                    match = re.search(r"python-version:\s*[\"']?(\d+\.\d+)", content)
                    if match:
                        return match.group(1)
                except OSError:
                    continue
        except OSError:
            pass

    return None


def detect_django():
    req_file = Path("requirements.txt")

    if not req_file.exists():
        return None

    content = req_file.read_text()

    match = re.search(
        r"(?i)^django\s*([<>=!~]=?)\s*([\d\.]+)",
        content,
        re.MULTILINE
    )

    if not match:
        return None

    version = match.group(2)

    # Normalize to major.minor
    parts = version.split(".")
    if len(parts) >= 2:
        return f"{parts[0]}.{parts[1]}"

    return f"{parts[0]}.0"


def scan_repo():
    results = {}

    node = detect_node()
    if node:
        results["node"] = node

    python = detect_python()
    if python:
        results["python"] = python

    django = detect_django()
    if django:
        results["django"] = django

    return results