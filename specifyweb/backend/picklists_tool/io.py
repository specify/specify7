from __future__ import annotations

import json
from typing import Any
from xml.dom import minidom
from xml.etree import ElementTree as ET

from specifyweb.specify.models import Picklist

PREP_TYPE_PICKLIST_NAME = 'PrepType'
PREP_TYPE_TABLE_NAME = 'preptype'
ITEMS_PICKLIST_TYPE = 0

_PICKLIST_FIELDS = (
    'name',
    'issystem',
    'type',
    'tablename',
    'fieldname',
    'filterfieldname',
    'filtervalue',
    'formatter',
    'readonly',
    'sizelimit',
    'sorttype',
)

def _blank_to_none(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return None if len(stripped) == 0 else stripped
    return str(value)

def _parse_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    normalized = str(value).strip().lower()
    if normalized in {'true', '1', 'yes'}:
        return True
    if normalized in {'false', '0', 'no'}:
        return False
    raise ValueError(f'Invalid boolean value: {value}')

def _parse_int(value: Any) -> int | None:
    normalized = _blank_to_none(value)
    return None if normalized is None else int(normalized)

def _normalize_item_payload(item: dict[str, Any], index: int) -> dict[str, Any]:
    title = _blank_to_none(item.get('title'))
    if title is None:
        raise ValueError('Picklist item is missing required "title" value.')
    return {
        'title': title,
        'value': _blank_to_none(item.get('value')),
        'ordinal': index if item.get('ordinal') is None else _parse_int(item.get('ordinal')),
    }

def normalize_picklist_payload(payload: dict[str, Any]) -> dict[str, Any]:
    name = _blank_to_none(payload.get('name'))
    if name is None:
        raise ValueError('Picklist is missing required "name" value.')

    picklist_type = payload.get('type')
    if picklist_type is None:
        raise ValueError(f'Picklist "{name}" is missing required "type" value.')

    normalized = {
        'name': name,
        'issystem': _parse_bool(payload.get('issystem'), False),
        'type': int(picklist_type),
        'tablename': _blank_to_none(payload.get('tablename')),
        'fieldname': _blank_to_none(payload.get('fieldname')),
        'filterfieldname': _blank_to_none(payload.get('filterfieldname')),
        'filtervalue': _blank_to_none(payload.get('filtervalue')),
        'formatter': _blank_to_none(payload.get('formatter')),
        'readonly': _parse_bool(payload.get('readonly'), False),
        'sizelimit': _parse_int(payload.get('sizelimit')),
        'sorttype': _parse_int(payload.get('sorttype')),
    }

    raw_items = payload.get('items') or []
    normalized['items'] = (
        []
        if normalized['type'] != ITEMS_PICKLIST_TYPE
        else [_normalize_item_payload(item, index) for index, item in enumerate(raw_items)]
    )
    return normalized

def picklist_to_payload(picklist: Picklist) -> dict[str, Any]:
    return normalize_picklist_payload(
        {
            field: getattr(picklist, field)
            for field in _PICKLIST_FIELDS
        }
        | {
            'items': [
                {
                    'title': item.title,
                    'value': item.value,
                    'ordinal': item.ordinal if item.ordinal is not None else index,
                }
                for index, item in enumerate(picklist.picklistitems.all())
            ]
        }
    )

def is_prep_type_picklist(payload: dict[str, Any]) -> bool:
    name = str(payload.get('name') or '').strip().lower()
    table_name = str(payload.get('tablename') or '').strip().lower()
    return name == PREP_TYPE_PICKLIST_NAME.lower() or table_name == PREP_TYPE_TABLE_NAME

def parse_picklists_text(raw_text: str) -> list[dict[str, Any]]:
    stripped = raw_text.lstrip()
    if len(stripped) == 0:
        raise ValueError('Picklist file is empty.')
    return (
        parse_picklists_xml(raw_text)
        if stripped.startswith('<')
        else parse_picklists_json(raw_text)
    )

def parse_picklists_json(raw_text: str) -> list[dict[str, Any]]:
    loaded = json.loads(raw_text)
    raw_picklists = (
        loaded.get('picklists')
        if isinstance(loaded, dict)
        else loaded
    )
    if isinstance(raw_picklists, dict):
        raw_picklists = [raw_picklists]
    if not isinstance(raw_picklists, list):
        raise ValueError('JSON picklist file must contain a list of picklists.')
    return [normalize_picklist_payload(item) for item in raw_picklists]

def parse_picklists_xml(raw_text: str) -> list[dict[str, Any]]:
    root = ET.fromstring(raw_text)
    if root.tag != 'picklists':
        raise ValueError('XML picklist file must have a <picklists> root element.')

    payloads: list[dict[str, Any]] = []
    for node in root.findall('picklist'):
        payload = {
            field: node.attrib.get(field)
            for field in _PICKLIST_FIELDS
            if field in node.attrib
        }
        items_parent = node.find('items')
        item_nodes = (
            items_parent.findall('item')
            if items_parent is not None
            else node.findall('item')
        )
        payload['items'] = [item.attrib for item in item_nodes]
        payloads.append(normalize_picklist_payload(payload))
    return payloads

def picklists_to_xml(payloads: list[dict[str, Any]]) -> str:
    root = ET.Element('picklists')
    root.set('version', '1')

    for payload in payloads:
        node = ET.SubElement(root, 'picklist')
        for field in _PICKLIST_FIELDS:
            value = payload.get(field)
            if value is None:
                continue
            node.set(
                field,
                str(value).lower() if isinstance(value, bool) else str(value),
            )

        if payload['type'] == ITEMS_PICKLIST_TYPE:
            items_node = ET.SubElement(node, 'items')
            for item in payload['items']:
                item_node = ET.SubElement(items_node, 'item')
                item_node.set('title', item['title'])
                if item.get('value') is not None:
                    item_node.set('value', item['value'])
                if item.get('ordinal') is not None:
                    item_node.set('ordinal', str(item['ordinal']))

    return minidom.parseString(ET.tostring(root, encoding='utf-8')).toprettyxml(
        indent='  '
    )
