from functools import reduce
from itertools import dropwhile

import logging
import csv
from typing import List, Dict, Tuple, Any, NamedTuple, Optional, Union

from django.db import transaction, connection

from specifyweb.specify import models
from specifyweb.specify.tree_extras import parent_joins, definition_joins

from .views import load

logger = logging.getLogger(__name__)

Row = Dict[str, str]
Filter = Dict[str, Any]

class Exclude(NamedTuple):
    lookup: str
    table: str
    filters: Filter


class FilterPack(NamedTuple):
    filters: List[Filter]
    excludes: List[Exclude]


class Uploaded(NamedTuple):
    id: int

    def get_id(self) -> Optional[int]:
        return self.id


class Matched(NamedTuple):
    id: int

    def get_id(self) -> Optional[int]:
        return self.id


class MatchedMultiple(NamedTuple):
    ids: List[int]

    def get_id(self) -> Optional[int]:
        return self.ids[0]


class NullRecord(object):
    def get_id(self) -> Optional[int]:
        return None


class UploadResult(NamedTuple):
    record_result: Union[Uploaded, Matched, MatchedMultiple, NullRecord]
    toOne: Dict[str, Any]
    toMany: Dict[str, Any]

    def get_id(self) -> Optional[int]:
        return self.record_result.get_id()


class ToManyRecord(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Any]

    def filter_on(self, path: str, row: Row) -> FilterPack:
        filters = {
            (path + '__' + fieldname): parse_value(None, fieldname, row[caption])
            for caption, fieldname in self.wbcols.items()
        }

        for toOneField, toOneTable in self.toOne.items():
            fs, es = toOneTable.filter_on(path + '__' + toOneField, row)
            for f in fs:
                filters.update(f)

        if all(v is None for v in filters.values()):
            return FilterPack([], [Exclude(path + "__in", self.name, self.static)])

        filters.update({
            (path + '__' + fieldname): value
            for fieldname, value in self.static.items()
        })

        return FilterPack([filters], [])

class TreeRecord(NamedTuple):
    name: str
    ranks: Dict[str, str]
    treedefname: str
    treedefid: int

    def filter_on(self, path: str, row: Row) -> FilterPack:
        return FilterPack([], [])

    def upload_row(self, row: Row) -> UploadResult:
        to_upload, matched = self.match(row)
        if not to_upload:
            if not matched:
                return UploadResult(NullRecord(), {}, {})
            elif len(matched) == 1:
                return UploadResult(Matched(matched[0]), {}, {})
            else:
                return UploadResult(MatchedMultiple(matched), {}, {})

        model = getattr(models, self.name)
        parent_id = matched[0] if matched else None

        for treedefitem, value in reversed(to_upload):
            uploaded = model.objects.create(
                name=value,
                definitionitem=treedefitem,
                definition_id=self.treedefid,
                parent_id=parent_id,
            )
            parent_id = uploaded.id

        return UploadResult(Uploaded(uploaded.id), {}, {})


    def match(self, row: Row) -> Tuple[List[List], List[int]]:
        model = getattr(models, self.name)
        tablename = model._meta.db_table
        treedef = getattr(models, self.treedefname).objects.get(id=self.treedefid)
        ranks = treedef.treedefitems.order_by("-rankid")
        depth = len(ranks)
        values = {
            rankname: parse_string(row[wbcol])
            for wbcol, rankname in self.ranks.items()
        }

        all_levels = list(dropwhile(lambda p: p[1] is None, (
            [rank, values.get(rank.name, None)]
            for rank in ranks)))

        if not all_levels:
            return ([], [])

        if all_levels[-1][1] is None:
            all_levels[-1][1] = "Upload"

        all_levels = [
            [rank, "Upload" if rank.isenforced and value is None else value]
            for rank, value in all_levels
            if value is not None or rank.isenforced
        ]

        cursor = connection.cursor()
        to_upload: List[List] = []
        while all_levels:
            matchers = [
                "and d{}.rankid = %s and t{}.name = %s\n".format(i,i)
                for i, __ in enumerate(all_levels)
            ]

            params = [
                p
                for rank, value in all_levels
                for p in (rank.rankid, value)
            ]


            sql = (
                "select t0.{table}id \n"
                "from {table} t0\n"
                "{parent_joins}\n"
                "{definition_joins}\n"
                "where t{root}.parentid is null\n"
                "{matchers}\n"
            ).format(
                root=depth-1,
                table=tablename,
                parent_joins=parent_joins(tablename, depth),
                definition_joins=definition_joins(tablename, depth),
                matchers="\n".join(matchers)
            )
            cursor.execute(sql, params)
            result = list(r[0] for r in cursor.fetchall())
            if result:
                return (to_upload, result)
            else:
                to_upload.append(all_levels.pop(0))

        return (to_upload, [])


class UploadTable(NamedTuple):
    name: str
    wbcols: Dict[str, str]
    static: Dict[str, Any]
    toOne: Dict[str, Any]
    toMany: Dict[str, List[ToManyRecord]]

    def filter_on(self, path: str, row: Row) -> FilterPack:
        filters = {
            (path + '__' + fieldname): parse_value(None, fieldname, row[caption])
            for caption, fieldname in self.wbcols.items()
        }

        for toOneField, toOneTable in self.toOne.items():
            fs, es = toOneTable.filter_on(path + '__' + toOneField, row)
            for f in fs:
                filters.update(f)

        if all(v is None for v in filters.values()):
            return FilterPack([], [Exclude(path + "__in", self.name, self.static)])

        filters.update({
            (path + '__' + fieldname): value
            for fieldname, value in self.static.items()
        })

        return FilterPack([filters], [])

    def upload_row(self, row: Row) -> UploadResult:
        model = getattr(models, self.name)

        toOneResults = {
            fieldname: to_one_def.upload_row(row)
            for fieldname, to_one_def in self.toOne.items()
        }

        attrs = {
            fieldname: parse_value(model, fieldname, row[caption])
            for caption, fieldname in self.wbcols.items()
        }

        attrs.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

        to_many_filters, to_many_excludes = to_many_filters_and_excludes(self.toMany, row)

        matched_records = reduce(lambda q, e: q.exclude(**{e.lookup: getattr(models, e.table).objects.filter(**e.filters)}),
                                 to_many_excludes,
                                 reduce(lambda q, f: q.filter(**f),
                                        to_many_filters,
                                        model.objects.filter(**attrs, **self.static)))

        n_matched = matched_records.count()
        if n_matched == 0:
            if any(v is not None for v in attrs.values()) or to_many_filters:
                uploaded = model.objects.create(**attrs, **self.static)
                toManyResults = {
                    fieldname: upload_to_manys(model, uploaded.id, fieldname, records, row)
                    for fieldname, records in self.toMany.items()
                }
                return UploadResult(Uploaded(id = uploaded.id), toOneResults, toManyResults)
            else:
                return UploadResult(NullRecord(), {}, {})

        elif n_matched == 1:
            return UploadResult(Matched(id = matched_records[0].id), toOneResults, {})

        else:
            return UploadResult(MatchedMultiple(ids = [r.id for r in matched_records]), toOneResults, {})




@transaction.atomic
def do_upload(wbid: int, upload_plan: UploadTable):
    logger.info('do_upload')
    wb = models.Workbench.objects.get(id=wbid)
    logger.debug('loading rows')
    rows = load(wbid)
    logger.debug('%d rows to upload', len(rows))
    wbtmis = models.Workbenchtemplatemappingitem.objects.filter(
        workbenchtemplate=wb.workbenchtemplate
    )
    return [
        upload_plan.upload_row(row)
        for row in rows
    ]


def do_upload_csv(csv_reader: csv.DictReader, upload_plan: UploadTable) -> List[UploadResult]:
    return [
        upload_plan.upload_row(row)
        for row in csv_reader
    ]



def to_many_filters_and_excludes(to_manys: Dict[str, List[ToManyRecord]], row: Row) -> FilterPack:
    filters: List[Dict] = []
    excludes: List[Exclude] = []

    for toManyField, records in to_manys.items():
        for record in records:
            fs, es = record.filter_on(toManyField, row)
            filters += fs
            excludes += es

    return FilterPack(filters, excludes)



def upload_to_manys(parent_model, parent_id, parent_field, records, row: Row) -> List[UploadResult]:
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        UploadTable(
            name = record.name,
            wbcols = record.wbcols,
            static = {**record.static, fk_field: parent_id},
            toOne = record.toOne,
            toMany = {},
        ).upload_row(row)

        for record in records
    ]


def parse_value(model, fieldname: str, value: str) -> Any:
    result: Any

    if value is not None:
        result = value.strip()
        if result == "":
            result = None
    return result

def parse_string(value: str) -> Optional[str]:
    result = value.strip()
    if result == "":
        return None
    return result

def caption_to_index(wbtmis, caption):
    for wbtmi in wbtmis:
        if wbtmi.caption == caption:
            return wbtmi.vieworder + 1
    raise Exception('no wb column named {}'.format(caption))
