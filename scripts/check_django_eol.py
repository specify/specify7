import requests
import datetime
import sys
import subprocess
import re
from requests import RequestException

THRESHOLD_DAYS = 180

#Test comment

def get_django_version():
    result = subprocess.run(
        [sys.executable, "-m", "django", "--version"],
        capture_output=True,
        text=True,
        timeout=30
    )

    if result.returncode != 0:
        print("ERROR: Unable to determine Django version")
        sys.exit(1)

    full_version = result.stdout.strip()

    # Example:
    # 4.2.16 -> 4.2
    m = re.match(r"^(\d+)\.(\d+)", full_version)
    if not m:
        print(f"ERROR: Unexpected Django version format: {full_version}")
        sys.exit(1)

    cycle = f"{m.group(1)}.{m.group(2)}"

    return full_version, cycle


def get_django_eol(cycle):
    url = "https://endoflife.date/api/django.json"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except RequestException as exc:
        print(f"ERROR: Failed to fetch EOL data: {exc}")
        sys.exit(1)

    data = response.json()

    for release in data:
        if release["cycle"] == cycle:
            return release["eol"]

    print(f"ERROR: No EOL data found for Django {cycle}")
    sys.exit(1)


def calculate_days_remaining(eol_date):
    today = datetime.date.today()
    eol = datetime.datetime.strptime(eol_date, "%Y-%m-%d").date()
    return (eol - today).days


def main():
    full_version, cycle = get_django_version()

    eol_date = get_django_eol(cycle)
    days_remaining = calculate_days_remaining(eol_date)

    status = "OK"
    if days_remaining < THRESHOLD_DAYS:
        status = "WARNING"

    # ---- structured output for GitHub Actions ----
    print(f"STATUS={status}")
    print(f"DJANGO_VERSION={full_version}")
    print(f"DJANGO_CYCLE={cycle}")
    print(f"EOL_DATE={eol_date}")
    print(f"DAYS_REMAINING={days_remaining}")

    # ---- human-readable log ----
    print("\n--- Django EOL Report ---")
    print(f"Version: {full_version}")
    print(f"Cycle: {cycle}")
    print(f"EOL date: {eol_date}")
    print(f"Days remaining: {days_remaining}")
    print(f"Status: {status}")

    # keep non-blocking behavior (CI should NOT fail)
    sys.exit(0)


if __name__ == "__main__":
    main()