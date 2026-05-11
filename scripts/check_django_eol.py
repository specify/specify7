import requests
import datetime
import sys
import subprocess

THRESHOLD_DAYS = 180


def get_django_version():
    result = subprocess.run(
        [sys.executable, "-m", "django", "--version"],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("ERROR: Unable to determine Django version")
        sys.exit(1)

    full_version = result.stdout.strip()

    # Example:
    # 4.2.16 -> 4.2
    cycle = ".".join(full_version.split(".")[:2])

    return full_version, cycle


def get_django_eol(cycle):
    url = "https://endoflife.date/api/django.json"

    response = requests.get(url)

    if response.status_code != 200:
        print("ERROR: Failed to fetch EOL data")
        sys.exit(1)

    data = response.json()

    for release in data:
        if release["cycle"] == cycle:
            return release["eol"]

    print(f"ERROR: No EOL data found for Django {cycle}")
    sys.exit(1)


def calculate_days_remaining(eol_date):
    today = datetime.date.today()
    eol = datetime.datetime.strptime(
        eol_date,
        "%Y-%m-%d"
    ).date()

    delta = eol - today

    return delta.days


def main():
    full_version, cycle = get_django_version()

    print(f"Detected Django version: {full_version}")

    eol_date = get_django_eol(cycle)

    print(f"Django {cycle} EOL date: {eol_date}")

    days_remaining = calculate_days_remaining(eol_date)

    print(f"Days remaining before EOL: {days_remaining}")

    if days_remaining < THRESHOLD_DAYS:
        print(
            f"ERROR: Django {cycle} has less than "
            f"{THRESHOLD_DAYS} days before EOL"
        )
        sys.exit(1)

    print("SUCCESS: Django version is within support window")


if __name__ == "__main__":
    main()