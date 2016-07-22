from django.db import models
from django.template.loader import get_template
from django.template import Context

from specifyweb.specify.models import Collection, Spexportschemamapping

class DarwinCoreArchive(models.Model):
    name = models.CharField(max_length=50)
    collection = models.ForeignKey(Collection)

class DarwinCoreRecordSet(models.Model):
    name = models.CharField(max_length=50)
    archive = models.ForeignKey(DarwinCoreArchive)
    row_type = models.CharField(max_length=255)
    is_core = models.BooleanField()
    mappings = models.ManyToManyField(Spexportschemamapping)
    core_id = models.IntegerField()

class DarwinCoreConstantField(models.Model):
    term = models.CharField(max_length=255)
    value = models.CharField(max_length=255)
    record_set = models.ForeignKey(DarwinCoreRecordSet)


def fields_from_mappings(mappings):
    return [{
        'index': i + 1,
        'term': m.exportedfieldname if m.exportschemaitem is None else m.exportschemaitem.fieldname}
        for i, m in enumerate(
                mappings
                .order_by('queryfield__position')
                .filter(queryfield__isdisplay=True))
    ]

def make_meta_xml(dwca):
    template = get_template('meta.xml')
    context = Context({
        'record_sets': [
            {
                'is_core': rs.is_core,
                'row_type': rs.row_type,
                'core_id': rs.core_id,
                'files': [m.mappingname for m in rs.mappings.all()],
                'fields': fields_from_mappings(rs.mappings.all()[0].mappings)
            }
            for rs in dwca.darwincorerecordset_set.all()
        ]
    })
    return template.render(context)
