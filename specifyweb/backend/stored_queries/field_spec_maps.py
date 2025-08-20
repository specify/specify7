from specifyweb.backend.stored_queries.queryfield import QueryField


def apply_specify_user_name(query_field: QueryField, user):
    if query_field.fieldspec.is_specify_username_end():
        if query_field.value == 'currentSpecifyUserName':
            return query_field._replace(value=user.name)

    return query_field
