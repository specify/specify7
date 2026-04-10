from django.db import migrations


class AddFieldIfMissing(migrations.AddField):
    """
    Guard against schema drift where the column already exists, but the migration is still recorded as unapplied.
    """

    def _column_exists(self, schema_editor, model, field):
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 1
                  FROM information_schema.columns
                 WHERE table_schema = DATABASE()
                   AND table_name = %s
                   AND column_name = %s
                """,
                [model._meta.db_table, field.column],
            )
            return cursor.fetchone() is not None

    def _ensure_foreign_key(self, schema_editor, model, field):
        if not (
            field.remote_field
            and schema_editor.connection.features.supports_foreign_keys
            and field.db_constraint
        ):
            return

        if schema_editor._constraint_names(model, [field.column], foreign_key=True):
            return

        constraint_suffix = "_fk_%(to_table)s_%(to_column)s"
        schema_editor.execute(
            schema_editor._create_fk_sql(model, field, constraint_suffix)
        )

    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        to_model = to_state.apps.get_model(app_label, self.model_name)
        if not self.allow_migrate_model(schema_editor.connection.alias, to_model):
            return

        field = to_model._meta.get_field(self.name)
        if self._column_exists(schema_editor, to_model, field):
            self._ensure_foreign_key(schema_editor, to_model, field)
            return

        super().database_forwards(app_label, schema_editor, from_state, to_state)

    def database_backwards(self, app_label, schema_editor, from_state, to_state):
        from_model = from_state.apps.get_model(app_label, self.model_name)
        if not self.allow_migrate_model(schema_editor.connection.alias, from_model):
            return

        field = from_model._meta.get_field(self.name)
        if not self._column_exists(schema_editor, from_model, field):
            return

        super().database_backwards(app_label, schema_editor, from_state, to_state)
