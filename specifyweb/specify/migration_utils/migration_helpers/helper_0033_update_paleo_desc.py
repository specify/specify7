
# ##########################################
# Used in 0033_update_paleo_desc.py
# ##########################################

MIGRATION_0033_TABLES = [
    ('Paleocontext', 'Paleo Context provides contextual information on the chronostratigraphy, lithostratigraphy, and biostratigraphy of a collection object, collecting event, or locality.'),
]

def update_paleo_desc(apps):
    def fix_table_description(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

        for table_name, table_desc in MIGRATION_0033_TABLES:
            containers = Splocalecontainer.objects.filter(name=table_name.lower(), schematype=0)
            Splocaleitemstr.objects.filter(containerdesc__in=containers).update(text=table_desc)

    fix_table_description(apps)