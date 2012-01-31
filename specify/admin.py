import django

from django.contrib import admin
from djangospecify.specify import models

from ajax_select.admin import AjaxSelectAdmin
from ajax_select import make_ajax_form

# for i in models.__dict__.values():
#     if isinstance(i, django.db.models.base.ModelBase):
#         admin.site.register(i)

class AgentAdmin(admin.ModelAdmin):
    pass

admin.site.register(models.Agent, AgentAdmin)

class CollectorInline(admin.TabularInline):
    model = models.Collector
    form = make_ajax_form(models.Collector, {'agent':'agent'})

class CollectingEventAdmin(AjaxSelectAdmin):
    inlines = [CollectorInline]
    form = make_ajax_form(models.Collectingevent, {'locality':'locality'})
admin.site.register(models.Collectingevent, CollectingEventAdmin)

class TaxonAdmin(AjaxSelectAdmin):
    form = make_ajax_form(models.Taxon,
                          {'parent':'taxon',
                           'accepted':'taxon'})
admin.site.register(models.Taxon, TaxonAdmin)

class DeterminationInline(admin.StackedInline):
    model = models.Determination
    form = make_ajax_form(models.Determination,
                          {'determiner':'agent',
                           'taxon':'taxon',
                           'preferredtaxon':'taxon'})


class CollectionObjectAdmin(AjaxSelectAdmin):
    inlines = [DeterminationInline]
    form = make_ajax_form(models.Collectionobject,
                          {'collectingevent':'collectingevent'})
admin.site.register(models.Collectionobject, CollectionObjectAdmin)
