import json
from functools import cache
from pathlib import Path


@cache
def get_discipline_names() -> dict[str, str]:
    """Load discipline labels shared by the frontend and backend."""
    path = (
        Path(__file__).parent.parent
        / 'frontend'
        / 'js_src'
        / 'lib'
        / 'disciplineNames.json'
    )
    with path.open(encoding='utf-8') as discipline_names_file:
        return json.load(discipline_names_file)
