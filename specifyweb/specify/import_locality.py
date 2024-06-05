import json

from typing import get_args as get_typing_args, Any, Dict, List, Tuple, Literal, Optional, NamedTuple, Union, Callable, TypedDict
from datetime import datetime
from django.db import transaction
from celery.exceptions import Ignore

import specifyweb.specify.models as spmodels

from specifyweb.celery_tasks import LogErrorsTask, app
from specifyweb.specify.datamodel import datamodel
from specifyweb.notifications.models import LocalityImport, Message
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

Progress = Callable[[str, int, int], None]


class LocalityImportStatus:
    PENDING = 'PENDING'
    PARSING = 'PARSING'
    PROGRESS = 'PROGRESS'
    SUCCEEDED = 'SUCCEEDED'
    ABORTED = 'ABORTED'
    FAILED = 'FAILED'


@app.task(base=LogErrorsTask, bind=True)
def import_locality_task(self, collection_id: int, column_headers: List[str], data: List[List[str]], create_recordset: bool) -> None:

    def progress(state, current: int, total: int):
        if not self.request.called_directly:
            self.update_state(state=state, meta={
                              'current': current, 'total': total})
    collection = spmodels.Collection.objects.get(id=collection_id)

    with transaction.atomic():
        results = upload_locality_set(
            collection, column_headers, data, progress)

        li = LocalityImport.objects.get(taskid=self.request.id)

        if results['type'] == 'ParseError':
            self.update_state(LocalityImportStatus.FAILED, meta={
                              "errors": results['errors']})
            li.status = LocalityImportStatus.FAILED
            li.result = json.dumps(results['errors'])
            Message.objects.create(user=li.specifyuser, content=json.dumps({
                'type': 'localityimport-failed',
                'taskid': li.taskid,
                'errors': json.dumps(results['errors'])
            }))
        elif results['type'] == 'Uploaded':
            li.recordset = create_localityimport_recordset(
                collection, li.specifyuser, results['localities']) if create_recordset else None

            recordset_id = None if li.recordset is None else li.recordset.pk

            self.update_state(state=LocalityImportStatus.SUCCEEDED, meta={
                              "recordsetid": recordset_id, "localities": results['localities'], "geocoorddetails": results['geocoorddetails']})
            li.result = json.dumps({
                'recordsetid': recordset_id,
                'localities': json.dumps(results['localities']),
                'geocoorddetails': json.dumps(results['geocoorddetails'])
            })
            li.status = LocalityImportStatus.SUCCEEDED
            Message.objects.create(user=li.specifyuser, content=json.dumps({
                'type': 'localityimport-succeeded',
                'taskid': li.taskid,
                'recordsetid': recordset_id,
                'localities': json.dumps(results['localities']),
                'geocoorddetails': json.dumps(results["geocoorddetails"])
            }))

        li.save()

    # prevent Celery from overriding the State of the Task
    raise Ignore()


class ParseError(NamedTuple):
    message: Union[ParseFailureKey, LocalityParseErrorMessageKey]
    field: Optional[str]
    payload: Optional[Dict[str, Any]]
    row_number: Optional[int]

    @classmethod
    def from_parse_failure(cls, parse_failure: BaseParseFailure, field: str, row_number: int):
        return cls(message=parse_failure.message, field=field, payload=parse_failure.payload, row_number=row_number)

    def to_json(self):
        return {"message": self.message, "field": self.field, "payload": self.payload, "rowNumber": self.row_number}


class ParseSuccess(NamedTuple):
    to_upload: Dict[str, Any]
    model: ImportModel
    locality_id: Optional[int]
    row_number: Optional[str]

    @classmethod
    def from_base_parse_success(cls, parse_success: BaseParseSuccess, model: ImportModel, locality_id: Optional[int], row_number: int):
        return cls(parse_success.to_upload, model, locality_id, row_number)


def parse_locality_set(collection, raw_headers: List[str], data: List[List[str]], progress: Optional[Progress] = None) -> Tuple[List[ParseSuccess], List[ParseError]]:
    errors: List[ParseError] = []
    to_upload: List[ParseSuccess] = []

    headers = [header.strip().lower() for header in raw_headers]

    if 'guid' not in headers:
        errors.append(ParseError(message='guidHeaderNotProvided',
                      field=None, payload=None, row_number=None))
        return to_upload, errors

    guid_index = headers.index('guid')
    updatable_locality_fields_index = [{'field': field, 'index': headers.index(
        field)} for field in headers if field.lower() in updatable_locality_fields]

    geocoorddetail_fields_index = [{'field': field, 'index': headers.index(
        field)} for field in headers if field.lower() in updatable_geocoorddetail_fields]

    processed = 0
    total = len(data)

    for row_mumber, row in enumerate(data):
        guid = row[guid_index]
        locality_query = spmodels.Locality.objects.filter(guid=guid)
        if len(locality_query) == 0:
            errors.append(ParseError(message='noLocalityMatchingGuid', field='guid',
                          payload={'guid': guid}, row_number=row_mumber))

        if len(locality_query) > 1:
            errors.append(ParseError(message='multipleLocalitiesWithGuid', field=None, payload={'guid': guid, 'localityIds': list(
                locality.id for locality in locality_query)}, row_number=row_mumber))

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

        merged_locality_result, locality_errors = merge_parse_results(
            'Locality', parsed_locality_fields, locality_id, row_mumber)

        merged_geocoorddetail_result, geocoord_errors = merge_parse_results(
            'Geocoorddetail', parsed_geocoorddetail_fields, locality_id, row_mumber)

        errors.extend([*locality_errors, *geocoord_errors])

        if merged_locality_result is not None:
            to_upload.append(merged_locality_result)

        if merged_geocoorddetail_result is not None:
            to_upload.append(merged_geocoorddetail_result)

        if progress is not None:
            processed += 1
            progress(LocalityImportStatus.PARSING, processed, total)

    return to_upload, errors


def parse_field(collection, table_name: ImportModel, field_name: str, field_value: str, locality_id: Optional[int], row_number: int):
    parsed = _parse_field(collection, table_name, field_name, field_value)

    if isinstance(parsed, BaseParseFailure):
        return ParseError.from_parse_failure(parsed, field_name, row_number)
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


class UploadSuccess(TypedDict):
    type: Literal["Uploaded"]
    localities: List[int]
    geocoorddetails: List[int]


class UploadParseError(TypedDict):
    type: Literal["ParseError"]
    errors: List[ParseError]


def upload_locality_set(collection, column_headers: List[str], data: List[List[str]], progress: Optional[Progress] = None) -> Union[UploadSuccess, UploadParseError]:
    to_upload, errors = parse_locality_set(
        collection, column_headers, data, progress)
    result = {
        "type": None,
    }

    if len(errors) > 0:
        result["type"] = "ParseError"
        result["errors"] = [error.to_json() for error in errors]
        return result

    result["type"] = "Uploaded"
    result["localities"] = []
    result["geocoorddetails"] = []

    processed = 0
    total = len(to_upload)

    with transaction.atomic():
        for parse_success in to_upload:
            uploadable = parse_success.to_upload
            model_name = parse_success.model
            locality_id = parse_success.locality_id

            if locality_id is None:
                raise ValueError(
                    f"No matching Locality found on row {parse_success.row_number}")

            model = getattr(spmodels, model_name)
            locality = spmodels.Locality.objects.get(id=locality_id)

            if model_name == 'Geocoorddetail':
                locality.geocoorddetails.get_queryset().delete()
                geoCoordDetail = model.objects.create(**uploadable)
                geoCoordDetail.locality = locality
                geoCoordDetail.save()
                result["geocoorddetails"].append(geoCoordDetail.id)
            elif model_name == 'Locality':
                # Queryset.update() is not used here as it does not send pre/post save signals
                for field, value in uploadable.items():
                    setattr(locality, field, value)
                locality.save()
                result["localities"].append(locality_id)
            if progress is not None:
                processed += 1
                progress(LocalityImportStatus.PROGRESS, processed, total)

    return result


# Example: Wed Jun 07 2023
DATE_FORMAT = r"%a %b %d %Y"


def create_localityimport_recordset(collection, specifyuser, locality_ids: List[int]):

    locality_table_id = datamodel.get_table_strict('Locality').tableId

    date_as_string = datetime.now().strftime(DATE_FORMAT)

    with transaction.atomic():
        rs = spmodels.Recordset.objects.create(
            collectionmemberid=collection.id,
            dbtableid=locality_table_id,
            name=f"{date_as_string} Locality Import",
            specifyuser=specifyuser,
            type=0,
            version=0
        )
        for locality_id in locality_ids:
            spmodels.Recordsetitem.objects.create(
                recordid=locality_id,
                recordset=rs
            )

    return rs
