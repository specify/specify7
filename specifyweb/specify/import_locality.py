from typing import Any, Dict, List, Union, Tuple, Literal, Optional, NamedTuple

from django.db.models import QuerySet

import specifyweb.specify.models as spmodels
from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.parse import parse_field as _parse_field, ParseFailure as BaseParseFailure, ParseSucess as BaseParseSuccess

ParseErrorMessageKey = Literal[
    'guidNotProvided',
    'noLocalityMatchingGuid',
    'multipleLocalitiesWithGuid',

    'coordinateBadFormat',
    'latitudeOutOfRange',
    'longitudeOutOfRange'
]

updatable_locality_fields = ['latitude1', 'longitude1', 'datum']
updatable_geocoorddetail_fields = [
    field.name for field in datamodel.get_table_strict('Geocoorddetail').fields]

ImportModel = Literal['Locality', 'Geocoorddetail']


class ParseError(NamedTuple):
    message: ParseErrorMessageKey
    payload: Optional[Dict[str, Any]]
    row_number: Optional[int]

    @classmethod
    def from_parse_failure(cls, parse_failure: BaseParseFailure, row_number: int):
        return cls(parse_failure.message, parse_failure.paylod, row_number)
    
    def to_json(self):
        return {"message": self.message, "payload": self.payload, "row_number": self.row_number}


class ParseSuccess(NamedTuple):
    to_upload: Dict[str, Any]
    model: ImportModel
    locality_id: Optional[int]
    row_number: Optional[str]

    @classmethod
    def from_base_parse_success(cls, parse_success: BaseParseSuccess, model: ImportModel, locality_id: Optional[int], row_number: int):
        return cls(parse_success.to_upload, model, locality_id, row_number)


def parse_locality_set(collection, raw_headers: List[str], data: List[List[str]]) -> Tuple[List[ParseSuccess], List[ParseError]]:
    errors: List[ParseError] = []
    to_upload: List[ParseSuccess] = []

    headers = [header.strip() for header in raw_headers]

    if 'guid' not in headers:
        errors.append(ParseError('guidHeaderNotProvided'))

    guid_index = headers.index('guid')
    updatable_locality_fields_index = [{'field': field, 'index': headers.index(
        field)} for field in headers if field.lower() in updatable_locality_fields]

    geocoorddetail_fields_index = [{'field': field, 'index': headers.index(
        field)} for field in headers if field.lower() in updatable_geocoorddetail_fields]

    for row_mumber, row in enumerate(data):
        guid = row[guid_index]
        locality_query = spmodels.Locality.objects.filter(guid=guid)
        if len(locality_query) == 0:
            errors.append(ParseError('noLocalityMatchingGuid',
                          {'guid': guid}, row_mumber))

        if len(locality_query) > 1:
            errors.append(ParseError('multipleLocalitiesWithGuid', {'localityIds': tuple(
                locality.id for locality in locality_query)}, row_mumber))

        locality_values = [{'field': dict['field'], 'value': row[dict['index']].strip()}
                           for dict in updatable_locality_fields_index]

        geocoorddetail_values = [{'field': dict['field'], 'value': row[dict['index']].strip()}
                                 for dict in geocoorddetail_fields_index]

        locality_id: Optional[int] = None if len(
            locality_query) != 1 else locality_query[0].id

        parsed_locality_fields = [parse_field(
            collection, 'Locality', dict['field'], dict['value'], locality_id, row_mumber) for dict in locality_values]

        parsed_geocoorddetail_fields = [parse_field(
            collection, 'Geocoorddetail', dict["field"], dict['value'], locality_id, row_mumber) for dict in geocoorddetail_values]

        for parsed in [*parsed_locality_fields, *parsed_geocoorddetail_fields]:
            if isinstance(parsed, ParseError):
                errors.append(parsed)
            else:
                to_upload.append(parsed)

    return to_upload, errors


def parse_field(collection, table_name: ImportModel, field_name: str, field_value: str, locality_id: Optional[int], row_number: int):
    parsed = _parse_field(collection, table_name, field_name, field_value)

    if isinstance(parsed, BaseParseFailure):
        return ParseError.from_parse_failure(parsed, row_number)
    else:
        return ParseSuccess.from_base_parse_success(parsed, table_name, locality_id, row_number)
