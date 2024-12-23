import json
import traceback

from typing import get_args as get_typing_args, Any, Dict, List, Tuple, Literal, Optional, NamedTuple, Union, Callable, TypedDict
from datetime import datetime
from django.db import transaction
from django.core.serializers.json import DjangoJSONEncoder
from celery.exceptions import Ignore

import specifyweb.specify.models as spmodels

from specifyweb.celery_tasks import LogErrorsTask, app
from specifyweb.specify.datamodel import datamodel
from specifyweb.notifications.models import LocalityUpdate, LocalityUpdateRowResult, Message
from specifyweb.specify.parse import ParseFailureKey, parse_field as _parse_field, ParseFailure as BaseParseFailure, ParseSucess as BaseParseSuccess
from specifyweb.specify.uiformatters import get_uiformatter

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

UpdateModel = Literal['Locality', 'Geocoorddetail']

localityupdate_parse_success = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "locality": {
                "type": "object"
            },
            "geocoorddetail": {
                "oneOf": [
                    {
                        "type": "object"
                    },
                    {
                        "type": "null"
                    }
                ]
            },
            "locality_id": {
                "type": "number",
                "minimum": 0
            },
            "row_number": {
                "type": "number",
                "minimum": 1
            }
        },
        "required": ["locality", "geocoorddetail", "locality_id", "row_number"],
        "additionalProperties": False
    }
}

localityupdate_parse_error = {
    "type": "array",
    "items": {
            "type": "object",
            "properties": {
                "message": {
                    "description": "Keys for errors which occured during parsing",
                    "type": "string",
                    "enum": localityParseErrorMessages
                },
                "field": {
                    "description": "The field name which had the parsing error",
                    "type": "string"
                },
                "payload": {
                    "description": "An object containing data relating to the error",
                    "type": "object",
                    "example": {'badType': 'Preson', 'validTypes': ['Organization', 'Person', 'Other', 'Group']}
                },
                "rowNumber": {
                    "type": "integer",
                    "minimum": 1
                }
            },
        "required": ["message", "field", "payload", "rowNumber"],
        "additionalProperties": False
    }
}

Progress = Callable[[str, int, int], None]


class LocalityUpdateStatus:
    PENDING = 'PENDING'
    PARSING = 'PARSING'
    PARSED = 'PARSED'
    PROGRESS = 'PROGRESS'
    SUCCEEDED = 'SUCCEEDED'
    ABORTED = 'ABORTED'
    PARSE_FAILED = 'PARSE_FAILED'
    FAILED = 'FAILED'


class LocalityUpdateTask(LogErrorsTask):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        # with transaction.atomic():
        #     locality_update = LocalityUpdate.objects.get(taskid=task_id)

        #     Message.objects.create(user=locality_update.specifyuser, content=json.dumps({
        #         'type': 'localityupdate-failed',
        #         'taskid': task_id,
        #         'traceback': str(einfo.traceback)
        #     }))
        #     locality_update.status = LocalityUpdateStatus.FAILED
        #     locality_update.save()

        return super().on_failure(exc, task_id, args, kwargs, einfo)


@app.task(base=LocalityUpdateTask, bind=True)
def update_locality_task(self, collection_id: int, column_headers: List[str], data: List[List[str]], create_recordset: bool) -> None:
    def progress(state, current: int, total: int):
        self.update_state(state=state, meta={
                          'current': current, 'total': total})

    collection = spmodels.Collection.objects.get(id=collection_id)

    with transaction.atomic():
        results = upload_locality_set(
            collection, column_headers, data, progress)

        lu = resolve_localityupdate_result(
            self.request.id, results, collection, create_recordset)

        if results['type'] == 'ParseError':
            self.update_state(LocalityUpdateStatus.PARSE_FAILED, meta={
                              "errors": [error.to_json() for error in results["errors"]]})

            Message.objects.create(user=lu.specifyuser, content=json.dumps({
                'type': 'localityupdate-parse-failed',
                'taskid': lu.taskid,
                'errors': [error.to_json() for error in results["errors"]]
            }))
        elif results['type'] == 'Uploaded':
            recordset_id = None if lu.recordset is None else lu.recordset.pk
            localitites = []
            geocoorddetails = []
            for row in results["results"]:
                localitites.append(row["locality"])
                if row["geocoorddetail"]:
                    geocoorddetails.append(row["geocoorddetail"])
            self.update_state(state=LocalityUpdateStatus.SUCCEEDED, meta={
                              "recordsetid": recordset_id, "localities": localitites, "geocoorddetails": geocoorddetails})

            Message.objects.create(user=lu.specifyuser, content=json.dumps({
                'type': 'localityupdate-succeeded',
                'taskid': lu.taskid,
                'recordsetid': recordset_id,
                "localities": localitites,
                "geocoorddetails": geocoorddetails
            }))

    # prevent Celery from overriding the State of the Task
    raise Ignore()


@app.task(base=LocalityUpdateTask, bind=True)
def parse_locality_task(self, collection_id: int, column_headers: List[str], data: List[List[str]]):
    def progress(state, current: int, total: int):
        self.update_state(state=state, meta={
                          'current': current, 'total': total})

    collection = spmodels.Collection.objects.get(id=collection_id)

    with transaction.atomic():
        to_upload, errors = parse_locality_set(
            collection, column_headers, data, progress)

        lu = resolve_localityupdate_result(
            self.request.id, (to_upload, errors), collection)

        if lu.status == LocalityUpdateStatus.PARSE_FAILED:
            self.update_state(LocalityUpdateStatus.PARSE_FAILED, meta={
                              "errors": [error.to_json() for error in errors]})

            Message.objects.create(user=lu.specifyuser, content=json.dumps({
                'type': 'localityupdate-parse-failed',
                'taskid': lu.taskid,
                'errors': [error.to_json() for error in errors]
            }))

        elif lu.status == LocalityUpdateStatus.PARSED:
            localitites = len(to_upload)
            geocoorddetails = 0
            for parsed in to_upload:
                if parsed['geocoorddetail'] is not None:
                    geocoorddetails += 1

            self.update_state(LocalityUpdateStatus.PARSED, meta={
                "localitites": localitites,
                "geocoorddetails": geocoorddetails
            })
            Message.objects.create(user=lu.specifyuser, content=json.dumps({
                'type': 'localityupdate-parse-succeeded',
                'taskid': lu.taskid,
                "localitites": localitites,
                "geocoorddetails": geocoorddetails
            }))

    # prevent Celery from overriding the State of the Task
    raise Ignore()


class JSONParseError(TypedDict):
    message: str
    field: str
    payload: Dict[str, Any]
    rowNumber: int


class ParseError(NamedTuple):
    message: Union[ParseFailureKey, LocalityParseErrorMessageKey]
    field: Optional[str]
    payload: Optional[Dict[str, Any]]
    row_number: Optional[int]

    @classmethod
    def from_parse_failure(cls, parse_failure: BaseParseFailure, field: str, row_number: int):
        return cls(message=parse_failure.message, field=field, payload=parse_failure.payload, row_number=row_number)

    def to_json(self) -> JSONParseError:
        return {"message": self.message, "field": self.field, "payload": self.payload, "rowNumber": self.row_number}


class ParsedRow(TypedDict):
    row_number: int
    locality: Dict[str, Any]
    geocoorddetail: Optional[Dict[str, Any]]
    locality_id: int


class ParseSuccess(NamedTuple):
    to_upload: Dict[str, Any]
    model: UpdateModel
    locality_id: Optional[int]
    row_number: Optional[str]

    @classmethod
    def from_base_parse_success(cls, parse_success: BaseParseSuccess, model: UpdateModel, locality_id: Optional[int], row_number: int):
        return cls(parse_success.to_upload, model, locality_id, row_number)


class UploadSuccessRow(TypedDict):
    locality: int
    geocoorddetail: Optional[int]


class UploadSuccess(TypedDict):
    type: Literal["Uploaded"]
    results: List[UploadSuccessRow]


class UploadParseError(TypedDict):
    type: Literal["ParseError"]
    errors: List[ParseError]


@transaction.atomic
def resolve_localityupdate_result(taskid: str, results: Union[Tuple[List[ParsedRow], List[ParseError]], Union[UploadSuccess, UploadParseError]], collection, create_recordset: bool = False) -> LocalityUpdate:

    lu = LocalityUpdate.objects.get(taskid=taskid)

    lu.results.get_queryset().delete()

    # the results come from parse_locality_set
    if isinstance(results, tuple):
        to_upload, errors = results
        if len(errors) > 0:
            lu.status = LocalityUpdateStatus.PARSE_FAILED
            for error in errors:
                result = error.to_json()
                LocalityUpdateRowResult.objects.create(
                    localityupdate=lu,
                    rownumber=result["rowNumber"],
                    result=json.dumps(result, cls=DjangoJSONEncoder)
                )
        else:
            lu.status = LocalityUpdateStatus.PARSED
            for parsed in to_upload:
                LocalityUpdateRowResult.objects.create(
                    localityupdate=lu,
                    rownumber=parsed["row_number"],
                    result=json.dumps(parsed, cls=DjangoJSONEncoder)
                )

    # the results come from upload_locality_set
    else:
        if results['type'] == 'ParseError':
            lu.status = LocalityUpdateStatus.PARSE_FAILED
            for error in results['errors']:
                result = error.to_json()
                LocalityUpdateRowResult.objects.create(
                    localityupdate=lu,
                    rownumber=error.row_number,
                    result=json.dumps(result, cls=DjangoJSONEncoder)
                )

        elif results['type'] == 'Uploaded':
            lu.status = LocalityUpdateStatus.SUCCEEDED
            localities = []
            for index, row in enumerate(results['results']):
                row_number = index + 1
                localities.append(row['locality'])

                LocalityUpdateRowResult.objects.create(
                    localityupdate=lu,
                    rownumber=row_number,
                    result=json.dumps(row, cls=DjangoJSONEncoder)
                )

            lu.recordset = create_localityupdate_recordset(
                collection, lu.specifyuser, localities) if create_recordset else None

    lu.save()

    return lu


def parse_locality_set(collection, raw_headers: List[str], data: List[List[str]], progress: Optional[Progress] = None) -> Tuple[List[ParsedRow], List[ParseError]]:
    errors: List[ParseError] = []
    to_upload: List[ParsedRow] = []

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

    for row_number, row in enumerate(data, start=1):
        guid = row[guid_index]
        locality_query = spmodels.Locality.objects.filter(guid=guid)
        if len(locality_query) == 0:
            errors.append(ParseError(message='noLocalityMatchingGuid', field='guid',
                          payload={'guid': guid}, row_number=row_number))

        if len(locality_query) > 1:
            errors.append(ParseError(message='multipleLocalitiesWithGuid', field=None, payload={'guid': guid, 'localityIds': list(
                locality.id for locality in locality_query)}, row_number=row_number))

        locality_values = [{'field': dict['field'], 'value': row[dict['index']].strip()}
                           for dict in updatable_locality_fields_index]

        geocoorddetail_values = [{'field': dict['field'], 'value': row[dict['index']].strip()}
                                 for dict in geocoorddetail_fields_index]

        locality_id: Optional[int] = None if len(
            locality_query) != 1 else locality_query[0].id

        parsed_locality_fields = [parse_field(
            collection, 'Locality', dict['field'], dict['value'], locality_id, row_number) for dict in locality_values if dict['value'].strip() != ""]

        parsed_geocoorddetail_fields = [parse_field(
            collection, 'Geocoorddetail', dict["field"], dict['value'], locality_id, row_number) for dict in geocoorddetail_values if dict['value'].strip() != ""]

        parsed_row, parsed_errors = merge_parse_results(
            [*parsed_locality_fields, *parsed_geocoorddetail_fields], locality_id, row_number)

        errors.extend(parsed_errors)
        to_upload.append(parsed_row)

        if progress is not None:
            processed += 1
            progress(LocalityUpdateStatus.PARSING, processed, total)

    return to_upload, errors


def parse_field(collection, table_name: UpdateModel, field_name: str, field_value: str, locality_id: Optional[int], row_number: int):
    ui_formatter = get_uiformatter(collection, table_name, field_name)
    scoped_formatter = None if ui_formatter is None else ui_formatter.apply_scope(collection)
    parsed = _parse_field(table_name, field_name, field_value, scoped_formatter)

    if isinstance(parsed, BaseParseFailure):
        return ParseError.from_parse_failure(parsed, field_name, row_number)
    else:
        return ParseSuccess.from_base_parse_success(parsed, table_name, locality_id, row_number)


def merge_parse_results(results: List[Union[ParseSuccess, ParseError]], locality_id: int, row_number: int) -> Tuple[ParsedRow, List[ParseError]]:
    to_upload: ParsedRow = {
        "locality_id": locality_id,
        "row_number": row_number,
        "locality": {},
        "geocoorddetail": {}
    }
    errors = []
    for result in results:
        if isinstance(result, ParseError):
            errors.append(result)
        else:
            to_upload[result.model.lower()].update(result.to_upload)

    if len(to_upload['geocoorddetail']) == 0:
        to_upload['geocoorddetail'] = None

    return to_upload, errors


def upload_locality_set(collection, column_headers: List[str], data: List[List[str]], progress: Optional[Progress] = None) -> Union[UploadSuccess, UploadParseError]:
    to_upload, errors = parse_locality_set(
        collection, column_headers, data, progress)

    if len(errors) > 0:
        return {
            "type": "ParseError",
            "errors": errors
        }

    return upload_from_parsed(to_upload, progress)


def upload_from_parsed(uploadables: List[ParsedRow], progress: Optional[Progress] = None) -> UploadSuccess:
    processed = 0
    total = len(uploadables)

    uploaded: List[UploadSuccessRow] = [
        {"locality": None, "geocoorddetail": None} for _ in range(total)]

    with transaction.atomic():
        for parsed_row in uploadables:
            locality_id = parsed_row["locality_id"]

            if locality_id is None:
                raise ValueError(
                    f"No matching Locality found on row {parsed_row['row_number']}")

            locality = spmodels.Locality.objects.get(id=locality_id)

            # Queryset.update() is not used here as it does not send pre/post save signals
            for field, value in parsed_row['locality'].items():
                setattr(locality, field, value)
            locality.save()
            uploaded[parsed_row['row_number'] -
                     1]["locality"] = locality_id

            if parsed_row['geocoorddetail'] is not None:
                locality.geocoorddetails.get_queryset().delete()
                geoCoordDetail = spmodels.Geocoorddetail.objects.create(
                    **parsed_row['geocoorddetail'])
                geoCoordDetail.locality = locality
                geoCoordDetail.save()
                uploaded[parsed_row["row_number"] -
                         1]["geocoorddetail"] = geoCoordDetail.pk

            if progress is not None:
                processed += 1
                progress(LocalityUpdateStatus.PROGRESS, processed, total)

    return {
        "type": "Uploaded",
        "results": uploaded
    }


# Example: Wed Jun 07 2023
DATE_FORMAT = r"%a %b %d %Y"


def create_localityupdate_recordset(collection, specifyuser, locality_ids: List[int]):

    locality_table_id = datamodel.get_table_strict('Locality').tableId

    date_as_string = datetime.now().strftime(DATE_FORMAT)

    with transaction.atomic():
        rs = spmodels.Recordset.objects.create(
            collectionmemberid=collection.id,
            dbtableid=locality_table_id,
            name=f"{date_as_string} Locality Update",
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
