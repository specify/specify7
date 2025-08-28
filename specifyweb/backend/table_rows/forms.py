from specifyweb.specify.api import GetCollectionForm
from django import forms

class RowsForm(GetCollectionForm):
    fields = forms.CharField(required=True) # type: ignore
    distinct = forms.CharField(required=False)
    defaults = dict(
        domainfilter=None,
        limit=0,
        offset=0,
        orderby=None,
        distinct=False,
        fields=None,
        filterchronostrat=False,
    )