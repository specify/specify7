from eol.scanner import scan_repo
from eol.runtimes import RUNTIMES
from eol.eol_api import get_eol_date, calculate_days_remaining

THRESHOLD_DAYS = 180


def run_one(product):
    run_all(filter_product=product)


def run_all(filter_product=None):
    detected = scan_repo()

    if filter_product:
        detected = {filter_product: detected.get(filter_product)}

    for name, version in detected.items():
        if not version:
            continue

        runtime = RUNTIMES.get(name)
        if not runtime:
            continue

        eol_date = get_eol_date(runtime.api, version)
        days = calculate_days_remaining(eol_date)

        status = "WARNING" if days < THRESHOLD_DAYS else "OK"

        print(f"STATUS={status}")
        print(f"{name.upper()}_VERSION={version}")
        print(f"{name.upper()}_CYCLE={version}")
        print(f"EOL_DATE={eol_date}")
        print(f"DAYS_REMAINING={days}")

        print(f"\n--- {runtime.display_name} ---")
        print(f"Version: {version}")
        print(f"EOL: {eol_date}")
        print(f"Status: {status}\n")