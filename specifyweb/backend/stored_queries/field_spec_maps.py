from typing import Callable, Iterable

from specifyweb.backend.stored_queries.queryfield import QueryField
from specifyweb.backend.stored_queries.relative_date_utils import relative_to_absolute_date

def transform_field_specs(query_fields: Iterable[QueryField], user):
    transform = query_field_transformer(user)
    for query_field in query_fields:
        yield transform(query_field)

def query_field_transformer(user) -> Callable[[QueryField], QueryField]:
    transforms = [
        apply_absolute_date,
        lambda qf: apply_specify_user_name(qf, user)
    ]
    def transform_query_field(query_field):
        qf = query_field
        for transform in transforms:
            qf = transform(qf)
        return qf
    return transform_query_field

def apply_specify_user_name(query_field: QueryField, user):
    if query_field.fieldspec.is_specify_username_end():
        if query_field.value == 'currentSpecifyUserName':
            return query_field._replace(value=user.name)

    return query_field

def apply_absolute_date(query_field: QueryField):
    if query_field.fieldspec.date_part is None or query_field.fieldspec.date_part != 'Full Date':
        return query_field

    field_value = query_field.value
    new_field_value = ','.join([relative_to_absolute_date(value_split) for value_split in field_value.split(',')])
    return query_field._replace(value=new_field_value)
