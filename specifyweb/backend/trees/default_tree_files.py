import csv
import gzip
import json
import re
import time
from pathlib import Path
from typing import Any, Dict, Iterator, Optional
from urllib.parse import unquote, urlparse

import requests
from django.conf import settings
from requests.exceptions import ChunkedEncodingError, ConnectionError

DEFAULT_TREE_DIR = Path('default_trees')
STATIC_CONFIG_PREFIX = '/static/config/'
LEGACY_DEFAULT_TREE_PREFIX = '/default_trees/'
TREE_ROW_DISCIPLINE_ALIASES = {
    'aves': 'bird',
    'mammalia': 'mammal',
    'orthoptera': 'insect',
}
KNOWN_REMOTE_DEFAULT_TREE_PATHS = {
    '/chronostratfiles/GeologicTimePeriod.csv': DEFAULT_TREE_DIR
    / 'GeologicTimePeriod.csv',
    '/geographyfiles/geonames.csv': DEFAULT_TREE_DIR / 'geonames.csv',
    '/taxonfiles/taxonfiles.json': DEFAULT_TREE_DIR / 'taxonfiles.json',
    '/treerows/geography.json': DEFAULT_TREE_DIR / 'mapping_files' / 'geography.json',
    '/treerows/geologictimeperiod.json': DEFAULT_TREE_DIR
    / 'mapping_files'
    / 'geologictimeperiod.json',
}

def _config_dir() -> Path:
    return Path(settings.SPECIFY_CONFIG_DIR).resolve()

def _is_remote_source(source: str | Path) -> bool:
    return urlparse(str(source)).scheme in ('http', 'https')

def _resolve_in_config(relative_path: Path) -> Optional[Path]:
    config_dir = _config_dir()
    if relative_path.is_absolute():
        candidate = relative_path.resolve()
    else:
        candidate = (config_dir / relative_path).resolve()

    try:
        candidate.relative_to(config_dir)
    except ValueError:
        return None

    try:
        candidate.relative_to((config_dir / DEFAULT_TREE_DIR).resolve())
    except ValueError:
        return None

    return candidate

def _tree_row_relative_path(file_name: str) -> Path:
    stem = Path(file_name).stem.lower()
    match = re.fullmatch(r'col\d+_(.+)', stem)
    if match is not None:
        stem = match.group(1)
    stem = TREE_ROW_DISCIPLINE_ALIASES.get(stem, stem)
    return DEFAULT_TREE_DIR / 'mapping_files' / f'{stem}.json'

def get_local_default_tree_path(source: str | Path) -> Optional[Path]:
    raw_source = str(source).strip()
    if not raw_source:
        return None

    parsed = urlparse(raw_source)
    parsed_path = Path(unquote(parsed.path))

    relative_path: Optional[Path] = None
    if parsed.scheme in ('http', 'https'):
        if parsed.path in KNOWN_REMOTE_DEFAULT_TREE_PATHS:
            relative_path = KNOWN_REMOTE_DEFAULT_TREE_PATHS[parsed.path]
        elif LEGACY_DEFAULT_TREE_PREFIX in parsed.path:
            _, suffix = parsed.path.split(LEGACY_DEFAULT_TREE_PREFIX, 1)
            relative_path = DEFAULT_TREE_DIR / suffix.lstrip('/')
        elif parsed.netloc == 'files.specifysoftware.org' and parsed.path.startswith('/treerows/'):
            relative_path = _tree_row_relative_path(parsed_path.name)
    else:
        source_without_query = raw_source.split('?', 1)[0]
        if source_without_query.startswith(STATIC_CONFIG_PREFIX):
            relative_path = Path(source_without_query.removeprefix(STATIC_CONFIG_PREFIX))
        elif source_without_query.startswith('static/config/'):
            relative_path = Path(source_without_query.removeprefix('static/config/'))
        else:
            path = Path(source_without_query)
            if path.is_absolute():
                return _resolve_in_config(path)
            relative_path = path

    if relative_path is None:
        return None

    return _resolve_in_config(relative_path)

def load_default_tree_json(source: str) -> Any:
    local_path = get_local_default_tree_path(source)
    if local_path is not None:
        if local_path.exists():
            with local_path.open('r', encoding='utf-8') as file_handle:
                return json.load(file_handle)
        if not _is_remote_source(source):
            raise FileNotFoundError(local_path)

    response = requests.get(source)
    response.raise_for_status()
    return response.json()

def _stream_local_default_tree_csv(path: Path) -> Iterator[Dict[str, str]]:
    csv_path = path
    if not csv_path.exists():
        gz_path = Path(f'{csv_path}.gz')
        if gz_path.exists():
            csv_path = gz_path
        else:
            raise FileNotFoundError(path)

    open_file = gzip.open if csv_path.suffix == '.gz' else open
    with open_file(csv_path, 'rt', encoding='utf-8-sig', newline='') as file_handle:
        yield from csv.DictReader(file_handle)

def _stream_remote_default_tree_csv(url: str) -> Iterator[Dict[str, str]]:
    chunk_size = 8192
    max_retries = 10

    def lines_iter() -> Iterator[str]:
        buffer = b''
        bytes_downloaded = 0
        retries = 0
        headers: dict[str, str] = {}

        while True:
            if bytes_downloaded > 0:
                headers['Range'] = f'bytes={bytes_downloaded}-'

            try:
                with requests.get(url, stream=True, timeout=(5, 30), headers=headers) as response:
                    response.raise_for_status()
                    for chunk in response.iter_content(chunk_size=chunk_size):
                        chunk_length = len(chunk)
                        if chunk_length == 0:
                            continue

                        buffer += chunk
                        bytes_downloaded += chunk_length

                        while True:
                            new_line_index = buffer.find(b'\n')
                            if new_line_index == -1:
                                break
                            line = buffer[: new_line_index + 1]
                            buffer = buffer[new_line_index + 1 :]
                            yield line.decode('utf-8-sig', errors='replace')

                    if buffer:
                        yield buffer.decode('utf-8-sig', errors='replace')
                    return
            except (ChunkedEncodingError, ConnectionError):
                if retries < max_retries:
                    retries += 1
                    time.sleep(2**retries)
                    continue
                raise

    yield from csv.DictReader(lines_iter())

def stream_default_tree_csv(source: str) -> Iterator[Dict[str, str]]:
    local_path = get_local_default_tree_path(source)
    if local_path is not None:
        try:
            yield from _stream_local_default_tree_csv(local_path)
            return
        except FileNotFoundError:
            if not _is_remote_source(source):
                raise

    yield from _stream_remote_default_tree_csv(source)
