from typing import get_args as get_typing_args, Any, Dict, List, Tuple, Literal, Optional, NamedTuple, Union

import specifyweb.specify.models as spmodels
from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.parse import ParseFailureKey, parse_field as _parse_field, ParseFailure as BaseParseFailure, ParseSucess as BaseParseSuccess

LocalityParseErrorMessageKey = Literal[
    'guidHeaderNotProvided',
    'noLocalityMatchingGuid',
    'multipleLocalitiesWithGuid',
]

# constructs a list with the string literals defined in the
# base ParseFailureKey and LocalityParseErrorMessageKey types
localityParseErrorMessages: List[LocalityParseErrorMessageKey] = list(
    set(get_typing_args(LocalityParseErrorMessageKey)) | set(get_typing_args(ParseFailureKey)))

updatable_locality_fields = ['latitude1', 'longitude1', 'datum']
updatable_geocoorddetail_fields = [
    field.name.lower() for field in datamodel.get_table_strict('Geocoorddetail').fields]

ImportModel = Literal['Locality', 'Geocoorddetail']


class ParseError(NamedTuple):
    message: Union[ParseFailureKey, LocalityParseErrorMessageKey]
    payload: Optional[Dict[str, Any]]
    row_number: Optional[int]

    @classmethod
    def from_parse_failure(cls, parse_failure: BaseParseFailure, row_number: int):
        return cls(parse_failure.message, parse_failure.payload, row_number)

    def to_json(self):
        return {"message": self.message, "payload": self.payload, "rowNumber": self.row_number}


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

    headers = [header.strip().lower() for header in raw_headers]

    if 'guid' not in headers:
        errors.append(ParseError('guidHeaderNotProvided', None, None))
        return to_upload, errors

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
            errors.append(ParseError('multipleLocalitiesWithGuid', {'guid': guid, 'localityIds': list(
                locality.id for locality in locality_query)}, row_mumber))

        locality_values = [{'field': dict['field'], 'value': row[dict['index']].strip()}
                           for dict in updatable_locality_fields_index]

        geocoorddetail_values = [{'field': dict['field'], 'value': row[dict['index']].strip()}
                                 for dict in geocoorddetail_fields_index]

        locality_id: Optional[int] = None if len(
            locality_query) != 1 else locality_query[0].id

        parsed_locality_fields = [parse_field(
            collection, 'Locality', dict['field'], dict['value'], locality_id, row_mumber) for dict in locality_values if dict['value'].strip() != ""]

        parsed_geocoorddetail_fields = [parse_field(
            collection, 'Geocoorddetail', dict["field"], dict['value'], locality_id, row_mumber) for dict in geocoorddetail_values if dict['value'].strip() != ""]
        
        merged_locality_result, locality_errors = merge_parse_results('Locality', parsed_locality_fields, locality_id, row_mumber)
        
        merged_geocoorddetail_result, geocoord_errors = merge_parse_results('Geocoorddetail', parsed_geocoorddetail_fields, locality_id, row_mumber)

        errors.extend([*locality_errors, *geocoord_errors])

        if merged_locality_result is not None:
            to_upload.append(merged_locality_result)
        
        if merged_geocoorddetail_result is not None:
            to_upload.append(merged_geocoorddetail_result)
        
    return to_upload, errors


def parse_field(collection, table_name: ImportModel, field_name: str, field_value: str, locality_id: Optional[int], row_number: int):
    parsed = _parse_field(collection, table_name, field_name, field_value)

    if isinstance(parsed, BaseParseFailure):
        return ParseError.from_parse_failure(parsed, row_number)
    else:
        return ParseSuccess.from_base_parse_success(parsed, table_name, locality_id, row_number)

def merge_parse_results(table_name: ImportModel, results: List[Union[ParseSuccess, ParseError]], locality_id: int, row_number: int) -> Tuple[Optional[ParseSuccess], List[ParseError]]:
    to_upload = {}
    errors = []
    for result in results:
        if isinstance(result, ParseError):
            errors.append(result)
        else:
            to_upload.update(result.to_upload)
    return None if len(to_upload) == 0 else ParseSuccess(to_upload, table_name, locality_id, row_number), errors
