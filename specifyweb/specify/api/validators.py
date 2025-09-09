from typing import Any
from django import forms
from django.core.exceptions import FieldDoesNotExist
import logging
from django.db.models.fields import FloatField, DecimalField

from specifyweb.specify import models
from specifyweb.specify.utils.field_change_info import FieldChangeInfo
from specifyweb.specify.models_utils.load_datamodel import Relationship
from specifyweb.specify.models_utils.relationships import _is_circular_relationship

logger = logging.getLogger(__name__)

class GetCollectionForm(forms.Form):
    # Use the logged_in_collection to limit request
    # to relevant items.
    domainfilter = forms.ChoiceField(choices=(('true', 'true'), ('false', 'false')),
                                     required=False)

    # Return at most 'limit' items.
    # Zero for all.
    limit = forms.IntegerField(required=False)

    # Return items starting from 'offset'.
    offset = forms.IntegerField(required=False)

    orderby = forms.CharField(required=False)

    filterchronostrat = forms.BooleanField(required=False)

    defaults = dict(
        domainfilter=None,
        limit=0,
        offset=0,
        orderby=None,
        filterchronostrat=False,
    )

    def clean_limit(self):
        limit = self.cleaned_data['limit']
        return 20 if limit is None else limit

    def clean_offset(self):
        offset = self.cleaned_data['offset']
        return 0 if offset is None else offset

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

def correct_field_name(model, field_name: str, ignore_properties: bool = True) -> str:
    """Return the correct field name for a model given a case insensitive
    field name. If the field is not found, raise FieldDoesNotExist.
    """
    if not ignore_properties:
        try:
            getattr(model, field_name) # Able to retrieve model @property
            return field_name
        except AttributeError as e:
            pass
    
    try:
        model._meta.get_field(field_name) # Retrieve field from model by proper name
        return field_name
    except FieldDoesNotExist:
        pass

    # Retrieve field from model by case insensitive name
    field_name = field_name.lower()
    for field in model._meta.get_fields():
        if field.name.lower() == field_name:
            return field.name
    
    raise FieldDoesNotExist(f"field '{field_name}' not found in {model}")

def _maybe_delete(data: dict[str, Any], to_delete: str):
    if to_delete in data:
        del data[to_delete]

def cleanData(model, data: dict[str, Any], parent_relationship: Relationship | None = None) -> dict[str, Any]:
    """Returns a copy of data with redundant resources removed and only 
    fields that are part of model, removing metadata fields and warning on 
    unexpected extra fields"""
    cleaned = {}
    for field_name in list(data.keys()):
        if field_name in ('resource_uri', 'recordset_info', '_tableName'):
            # These fields are meta data, not part of the resource.
            continue

        try:
            db_field_name = correct_field_name(model, field_name)
        except FieldDoesNotExist:
            logger.warning('field "%s" does not exist in %s', field_name, model)
        else:
            if _is_circular_relationship(model, db_field_name, parent_relationship): 
                parent_name: str = getattr(parent_relationship, 'name', '')
                """If this would add a redundant resource - e.g., 
                Accession -> collectionObjects -> accession - then omit the 
                final resource from the cleaned data
                """
                logger.warning(f"circular/redundant relationship {parent_name} -> {db_field_name} found in data. Skipping update/create of {db_field_name}")
                continue
            cleaned[db_field_name] = data[field_name]

        # Unset date precision if date is not set, but precision is
        # Set date precision if date is set, but precision is not
        if field_name.endswith('precision'):
            precision_field_name = field_name
            date_field_name = field_name[:-len('precision')]
            if date_field_name in data:
                date = data[date_field_name]
                has_date = date is not None and date != ''
                has_precision = data[precision_field_name] is not None
                if has_date and not has_precision:
                    # Assume full precision
                    cleaned[precision_field_name] = 1
                elif not has_date and has_precision:
                    cleaned[precision_field_name] = None
        
    if model is models.Agent:
        # setting user agents is part of the user management system.
        _maybe_delete(cleaned, 'specifyuser')

    # guid should only be updatable for taxon and geography
    if model not in (models.Taxon, models.Geography):
        _maybe_delete(cleaned, 'guid')

    # timestampcreated should never be updated.
    #  _maybe_delete(cleaned, 'timestampcreated')

    # Password should be set though the /accounts/set_password/<id>/ endpoint
    if model is models.Specifyuser: 
        _maybe_delete(cleaned, 'password')

    return cleaned


def fld_change_info(obj, field, val) -> FieldChangeInfo | None:
    from specifyweb.specify.api.serializers import prepare_value

    if field.name != 'timestampmodified':
        value = prepare_value(field, val)
        if isinstance(field, FloatField) or isinstance(field, DecimalField):
            value = None if value is None else float(value)
        old_value = getattr(obj, field.name)
        if str(old_value) != str(value): # ugh
            return FieldChangeInfo(field_name=field.name, old_value=old_value, new_value=value)
    return None


