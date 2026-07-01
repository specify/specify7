import requests
import datetime
import sys
from requests import RequestException


def get_eol_date(api_url: str, cycle: str):
    try:
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
    except RequestException as exc:
        print(f"ERROR: Failed to fetch EOL data: {exc}")
        sys.exit(1)

    for release in response.json():
        if str(release["cycle"]) == cycle:
            return release["eol"]

    print(f"ERROR: No EOL data found for cycle {cycle}")
    sys.exit(1)


def calculate_days_remaining(eol_date: str):
    if not isinstance(eol_date, str) or not eol_date or eol_date is False:
        return None

    try:
        today = datetime.date.today()
        eol = datetime.datetime.strptime(eol_date, "%Y-%m-%d").date()
        return (eol - today).days
    except ValueError:
        return None