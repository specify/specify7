import sys

from scripts.eol.runner import run_all


if __name__ == "__main__":
    if len(sys.argv) == 1:
        run_all()
    else:
        from eol.runner import run_one
        run_one(sys.argv[1].lower())