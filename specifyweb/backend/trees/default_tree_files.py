import csv
import gzip
import json
import time
from pathlib import Path
from typing import Dict, Iterator, Optional
from urllib.parse import unquote, urlparse

import requests
from django.conf import settings
from requests.exceptions import ChunkedEncodingError, ConnectionError


STATIC_CONFIG_PREFIX = '/static/config/'
DEFAULT_TREE_MAPPING_DIR = 'default_trees/mapping_files'


def _config_root() -> Path:
    return Path(settings.SPECIFY_CONFIG_DIR).resolve()


def _resolve_config_path(relative_path: str) -> Optional[Path]:
    config_root = _config_root()
    candidate = (config_root / relative_path).resolve()
    try:
        candidate.relative_to(config_root)
    except ValueError:
        return None
    if not candidate.is_file() and candidate.suffix == '.csv':
        gz_candidate = candidate.with_name(f'{candidate.name}.gz')
        if gz_candidate.is_file():
            return gz_candidate
    return candidate


def _legacy_default_tree_relative_path(source: str) -> Optional[str]:
    parsed = urlparse(source)
    path = unquote(parsed.path)

    if path.startswith(STATIC_CONFIG_PREFIX):
        return path[len(STATIC_CONFIG_PREFIX):]

    if parsed.netloc == 'specify-software-public.s3.us-east-1.amazonaws.com':
        if path.startswith('/default_trees/'):
            return path.lstrip('/')
        return None

    if parsed.netloc != 'files.specifysoftware.org':
        return None

    filename = Path(path).name
    if path.startswith('/taxonfiles/'):
        return f'default_trees/{filename}'
    if path.startswith('/geographyfiles/'):
        return f'default_trees/{filename}'
    if path.startswith('/chronostratfiles/'):
        return f'default_trees/{filename}'
    if path.startswith('/treerows/'):
        if filename == 'col2008_orthoptera.json':
            filename = 'insect.json'
        return f'{DEFAULT_TREE_MAPPING_DIR}/{filename}'
    return None


def get_local_default_tree_path(source: str) -> Optional[Path]:
    if not source:
        return None

    parsed = urlparse(source)
    parsed_path = unquote(parsed.path or source)

    if parsed.scheme in ('http', 'https'):
        relative_path = _legacy_default_tree_relative_path(source)
        if relative_path is None:
            return None
        return _resolve_config_path(relative_path)

    if parsed_path.startswith(STATIC_CONFIG_PREFIX):
        return _resolve_config_path(parsed_path[len(STATIC_CONFIG_PREFIX):])

    if parsed_path.startswith('config/'):
        return _resolve_config_path(parsed_path[len('config/'):])

    path = Path(parsed_path)
    if path.is_absolute():
        resolved = path.resolve()
        try:
            resolved.relative_to(_config_root())
        except ValueError:
            return None
        return resolved

    return _resolve_config_path(parsed_path)


def load_default_tree_json(source: str):
    local_path = get_local_default_tree_path(source)
    if local_path is not None:
        if not local_path.is_file():
            raise FileNotFoundError(f'Default tree JSON file not found: {local_path}')
        with local_path.open('r', encoding='utf-8') as file_handle:
            return json.load(file_handle)

    parsed = urlparse(source)
    if parsed.scheme not in ('http', 'https'):
        raise FileNotFoundError(f'Default tree JSON file not found: {source}')

    resp = requests.get(source, timeout=(5, 30))
    resp.raise_for_status()
    return resp.json()


def stream_default_tree_csv(source: str) -> Iterator[Dict[str, str]]:
    local_path = get_local_default_tree_path(source)
    if local_path is not None:
        if not local_path.is_file():
            raise FileNotFoundError(f'Default tree CSV file not found: {local_path}')
        open_file = gzip.open if local_path.suffix == '.gz' else Path.open
        with open_file(local_path, 'rt', encoding='utf-8-sig', newline='') as file_handle:
            yield from csv.DictReader(file_handle)
        return

    parsed = urlparse(source)
    if parsed.scheme not in ('http', 'https'):
        raise FileNotFoundError(f'Default tree CSV file not found: {source}')

    yield from _stream_remote_csv(source)


def _stream_remote_csv(source: str) -> Iterator[Dict[str, str]]:
    chunk_size = 8192
    max_retries = 10

    def lines_iter() -> Iterator[str]:
        buffer = b""
        bytes_downloaded = 0
        retries = 0

        headers = {}
        while True:
            if bytes_downloaded > 0:
                headers['Range'] = f'bytes={bytes_downloaded}-'

            try:
                with requests.get(
                    source,
                    stream=True,
                    timeout=(5, 30),
                    headers=headers,
                ) as resp:
                    resp.raise_for_status()
                    for chunk in resp.iter_content(chunk_size=chunk_size):
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
