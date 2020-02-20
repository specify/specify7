from collections import namedtuple
import logging
logger = logging.getLogger(__name__)

from django.db import transaction

from specifyweb.specify import models

from .views import load

class Uploaded(namedtuple('Uploaded', 'id')):
    def get_id(self):
        return self.id

class Matched(namedtuple('Matched', 'id')):
    def get_id(self):
        return self.id

class MatchedMultiple(namedtuple('MatchedMultiple', 'ids')):
    def get_id(self):
        return self.ids[0]

class NullRecord(namedtuple('NullRecord', '')):
    def get_id(self):
        return None

class UploadResult(namedtuple('UploadResult', 'record_result toOne toMany')):
    def get_id(self):
        return self.record_result.get_id()

@transaction.atomic
def do_upload(wbid, upload_plan):
    logger.info('do_upload')
    wb = models.Workbench.objects.get(id=wbid)
    logger.debug('loading rows')
    rows = load(wbid)
    logger.debug('%d rows to upload', len(rows))
    wbtmis = models.Workbenchtemplatemappingitem.objects.filter(
        workbenchtemplate=wb.workbenchtemplate
    )
    return [
        upload_row_table(upload_plan, row, wbtmis)
        for row in rows
    ]


def upload_row_table(upload_table, row, wbtmis):
    model = getattr(models, upload_table.name)

    toOneResults = {
        fieldname: upload_row_table(fk_table, row, wbtmis)
        for fieldname, fk_table in upload_table.toOne.items()
    }

    filters = {
        fieldname: parse_value(model, fieldname, row[caption_to_index(wbtmis, caption)])
        for caption, fieldname in upload_table.wbcols.items()
    }

    filters.update({ model._meta.get_field(fieldname).attname: v.get_id() for fieldname, v in toOneResults.items() })

    if all(v is None for v in filters.values()):
        return UploadResult(NullRecord(), {}, {})

    filters.update(upload_table.static)

    try:
        matched_records = model.objects.filter(**filters)
    except:
        import ipdb; ipdb.set_trace()
    nmatched = matched_records.count()

    if nmatched == 0:
        uploaded = model.objects.create(**filters)
        toManyResults = {
            fieldname: upload_to_manys(model, uploaded.id, fieldname, records, row, wbtmis)
            for fieldname, records in upload_table.toMany.items()
        }

        return UploadResult(Uploaded(id = uploaded.id), toOneResults, toManyResults)
    elif nmatched == 1:
        return UploadResult(Matched(id = matched_records[0].id), toOneResults, {})
    else:
        return UploadResult(MatchedMultiple(ids = [r.id for r in matched_records]), toOneResults, {})


def upload_to_manys(parent_model, parent_id, parent_field, records, row, wbtmis):
    fk_field = parent_model._meta.get_field(parent_field).remote_field.attname

    return [
        upload_row_table(UploadTable(
            name = record.name,
            wbcols = record.wbcols,
            static = merge_dict(record.static, {fk_field: parent_id}),
            toOne = record.toOne,
            toMany = {},
        ), row, wbtmis)

        for record in records
    ]


def merge_dict(a, b):
    c = a.copy()
    c.update(b)
    return c

def parse_value(model, fieldname, value):
    if value is not None:
        value = value.strip()
        if value == "":
            value = None
    return value

def caption_to_index(wbtmis, caption):
    for wbtmi in wbtmis:
        if wbtmi.caption == caption:
            return wbtmi.vieworder + 1
    raise Exception('no wb column named {}'.format(caption))

UploadTable = namedtuple('UploadTable', 'name wbcols static toOne toMany')
ToManyRecord = namedtuple('ToManyRecord', 'name wbcols static toOne')

example_plan = UploadTable(
    name = 'Collectingevent',
    wbcols = {
        # 'End Date Collected' : 'enddate',
        # 'Start Date Collected' : 'startdate',
        'Station No.' : 'stationfieldnumber',
    },
    static = {'discipline_id': 3},
    toOne = {},
    toMany = {
        'collectors': [
            ToManyRecord(
                name = 'Collector',
                wbcols = {},
                static = {'isprimary': True, 'ordernumber': 0},
                toOne = {
                    'agent': UploadTable(
                        name = 'Agent',
                        wbcols = {
                            'Collector 1 Title'          : 'title',
                            'Collector 1 First Name'     : 'firstname',
                            'Collector 1 Middle Initial' : 'middleinitial',
                            'Collector 1 Last Name'      : 'lastname',
                        },
                        static = {
                            'agenttype': 1
                        },
                        toOne = {},
                        toMany = {},
                    )
                }
            ),
        ]

    }
)

# BMSM No.
# Class
# Superfamily
# Family
# Genus
# Subgenus
# Species
# Subspecies
# Species Author
# Subspecies Author
# Determiner 1 Title
# Determiner 1 First Name
# Determiner 1 Middle Initial
# Determiner 1 Last Name
# ID Date
# Country
# Date Collected
# Start Date Collected
# End Date Collected
# Collection Method
# Prep Type 1
# Accession No.
# Remarks
# Cataloged by
# DateCataloged
# Latitude1
# Latitude2
# Longitude1
# Longitude2
# Lat Long Type
# Station No.
# Collector 1 Title
# Collector 1 First Name
# Collector 1 Middle Initial
# Collector 1 Last Name
# Collector 2 Title
# Collector 2 First Name
# Collector 2 Middle Initial
# Collector 2 Last name
