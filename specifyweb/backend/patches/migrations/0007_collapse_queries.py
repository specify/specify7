from django.db import migrations, connection

from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.specify.datamodel import datamodel


def remove_directly_cyclical_queryfields(apps, schema_editor):
    Spquery = apps.get_model('specify', 'Spquery')

    queries = Spquery.objects.filter(
        selectdistinct=True).prefetch_related('fields')

    for query in queries:
        fields = query.fields.all()
        non_circular_fields = [field for field in fields if not contains_directly_circular(
            field.stringid, field.isrelfld or False)]
        query.fields.set(non_circular_fields)


def contains_directly_circular(string_id: str, is_relation: bool) -> bool:
    field_spec = QueryFieldSpec.from_stringid(string_id, is_relation)
    join_path = field_spec.join_path
    return any(field is datamodel.reverse_relationship(join_path[index - 1])
               for index, field in enumerate(join_path) if index >= 1)


class Migration(migrations.Migration):

    dependencies = [
        ('patches', '0006_version_fix'),
    ]

    operations = [
        migrations.RunPython(remove_directly_cyclical_queryfields,
                             migrations.RunPython.noop, atomic=True)
    ]
