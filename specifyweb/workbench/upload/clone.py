# generic logic for cloning records. TODO: Make this part of the generic API and server-side cloning

import json
from typing import Any, Callable, Dict, List

from django.db.models import Model
from django.db import transaction

from specifyweb.specify.func import Func
from specifyweb.specify.load_datamodel import Table
from specifyweb.specify.models import ModelWithTable

FIELDS_TO_NOT_CLONE: Dict[str, List[str]] = json.load(
    open("specifyweb/frontend/js_src/lib/components/DataModel/uniqueFields.json")
)

# These fields are system fields. This is a bit different than uniqueFields on frontend at DataModel/resource.ts in that we don't want to skip all those fields
# when checking whether the record is null. Those fields would be, skipped, during cloning, but not when checking whether record is null.
# TODO: See if we have enough reason to just directly take those fields...

GENERIC_FIELDS_TO_SKIP = [
    "timestampcreated",
    "timestampmodified",
    "version",
    "id",
    "createdbyagent_id",
    "modifiedbyagent_id",
    "guid",
]


@transaction.atomic()
def clone_record(
    reference_record,
    inserter: Callable[[ModelWithTable, Dict[str, Any]], ModelWithTable],
    one_to_ones={},
    to_ignore: List[str] = [],
    override_attrs={},
) -> ModelWithTable:
    model: ModelWithTable = type(reference_record)  # type: ignore
    model_name = model._meta.model_name
    assert model_name is not None
    specify_model = model.specify_model
    # We could be smarter here, and make our own list, but this is indication that there were new tables or something, and we can't assume our schema version is correct.
    assert (
        model_name.lower() in FIELDS_TO_NOT_CLONE
    ), f"Schema mismatch detected at {model_name}"

    fields_to_ignore = [
        *[field.lower() for field in FIELDS_TO_NOT_CLONE[model_name.lower()]],
        *to_ignore,
        *GENERIC_FIELDS_TO_SKIP,
    ]

    all_fields = [
        field
        for field in model._meta.get_fields()
        if field.name not in fields_to_ignore
    ]

    marked = [
        (
            field,
            (
                field.is_relation
                and specify_model.get_relationship(field.name).dependent
                or field.name.lower() in one_to_ones.get(model_name.lower(), [])
                and field.name is not None
            ),
        )
        for field in all_fields
    ]

    def _cloned(value, field, is_dependent):
        if not is_dependent:
            return value
        return clone_record(
            getattr(reference_record, field.name), inserter, one_to_ones
        ).pk

    attrs = {
        field.attname: Func.maybe(getattr(reference_record, field.attname), lambda obj: _cloned(obj, field, is_dependent))  # type: ignore
        for (field, is_dependent) in marked
        # This will handle many-to-ones + one-to-ones
        if field.concrete
    }

    attrs = {**attrs, **override_attrs}

    inserted = inserter(model, attrs)

    to_many_cloned = [
        [
            clone_record(to_many_record, inserter, one_to_ones, override_attrs={field.remote_field.attname: inserted.pk})  # type: ignore
            for to_many_record in getattr(
                reference_record, field.name
            ).all()  # Clone all records separatetly
        ]
        for (field, is_dependent) in marked
        if is_dependent and not field.concrete
    ]  # Should be a relationship, but not on our side

    return inserted
