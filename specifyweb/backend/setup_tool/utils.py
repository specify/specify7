import json
from pathlib import Path

import logging
logger = logging.getLogger(__name__)

def load_json_from_file(path: Path):
    """
    Safely load JSON from a file included within Specify directories.
    """

    if path.exists() and path.is_file():
        try:
            with path.open('r', encoding='utf-8') as fh:
                return json.load(fh)
        except json.JSONDecodeError as e:
            logger.exception('Failed to decode JSON from %s: %s', path, e)
            return None
        except Exception as e:
            logger.exception('Failed to decode JSON from %s: %s', path, e)
            return None
    else:
        logger.exception('JSON file at %s does not exist.', path)
        return None

def normalize_keys(obj):
    if isinstance(obj, dict):
        return {k.lower(): normalize_keys(v) for k, v in obj.items()}
    else:
        return obj