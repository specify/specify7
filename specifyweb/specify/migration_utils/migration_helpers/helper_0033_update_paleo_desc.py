
# ##########################################
# Used in 0033_update_paleo_desc.py
# ##########################################

MIGRATION_0033_TABLES = [
    ('Paleocontext', 'Paleo Context provides contextual information on the chronostratigraphy, lithostratigraphy, and biostratigraphy of a collection object, collecting event, or locality.'),
]

def update_paleo_desc(apps):
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table_name, table_desc in MIGRATION_0033_TABLES:
        Splocaleitemstr.objects.filter(
            containerdesc__name=table_name.lower(),
            containerdesc__schematype=0,
            language="en"
        ).update(
            text=table_desc
        )
