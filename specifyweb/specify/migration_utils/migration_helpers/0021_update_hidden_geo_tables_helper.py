from specifyweb.specify.models_utils.model_extras import GEOLOGY_DISCIPLINES, PALEO_DISCIPLINES

# ##########################################
# Used in 0021_update_hidden_geo_tables.py
# ##########################################

MIGRATION_0021_FIELDS = {
    'CollectionObject': ['relativeAges', 'absoluteAges', 'cojo'],
}

def fix_hidden_geo_prop(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    excluded_disciplines = PALEO_DISCIPLINES | GEOLOGY_DISCIPLINES

    filtered_disciplines = Discipline.objects.exclude(type__in=excluded_disciplines)

    for discipline in filtered_disciplines:
        for table, fields in MIGRATION_0021_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                # BUG: What if the user wants the field unhidden?
                Splocalecontaineritem.objects.filter(
                    container=container,
                    name__in=tuple(map(lambda field_name: field_name.lower(), fields))
                ).update(ishidden=True)

def reverse_fix_hidden_geo_prop(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    excluded_disciplines = PALEO_DISCIPLINES | GEOLOGY_DISCIPLINES

    filtered_disciplines = Discipline.objects.exclude(type__in=excluded_disciplines)

    for discipline in filtered_disciplines:
        for table, fields in MIGRATION_0021_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                # BUG: What if the user wants the field hidden? 
                Splocalecontaineritem.objects.filter(
                    container=container,
                    name__in=tuple(map(lambda field_name: field_name.lower(), fields))
                ).update(ishidden=False)