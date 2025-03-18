import logging
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import transaction
from specifyweb.businessrules.migration_utils import catnum_rule_editable
from specifyweb.businessrules.uniqueness_rules import (
    apply_default_uniqueness_rules
)
from specifyweb.permissions.migration_utils.edit_permissions import add_permission, add_stats_edit_permission
from specifyweb.specify.migration_utils.default_cots import (
    create_cogtype_type_picklist,
    create_cotype_picklist,
    create_default_collection_types,
    create_default_discipline_for_tree_defs,
    fix_taxon_treedef_discipline_links,
    set_discipline_for_taxon_treedefs,
    fix_tectonic_unit_treedef_discipline_links
)
from specifyweb.permissions.initialize import initialize
from specifyweb.specify.migration_utils import update_schema_config as usc
from specifyweb.specify.migration_utils.tectonic_ranks import create_default_tectonic_ranks, create_root_tectonic_node

logger = logging.getLogger(__name__)

def fix_cots():
    create_default_collection_types(apps)
    create_default_discipline_for_tree_defs(apps)
    create_cogtype_type_picklist(apps)
    set_discipline_for_taxon_treedefs(apps)
    fix_taxon_treedef_discipline_links(apps)
    create_cotype_picklist(apps)

def fix_schema_config():
    usc.create_geo_table_schema_config_with_defaults(apps) # 2
    usc.create_cotype_splocalecontaineritem(apps) # 3
    usc.create_strat_table_schema_config_with_defaults(apps) # 4 - getting skip warnings
    usc.update_cog_type_fields(apps) # 7
    usc.create_cogtype_picklist(apps) # 7
    usc.update_cogtype_splocalecontaineritem(apps) # 7
    usc.update_systemcogtypes_picklist(apps) # 7
    usc.update_cogtype_type_splocalecontaineritem(apps) # 7
    usc.update_relative_age_fields(apps) # 8
    usc.add_cojo_to_schema_config(apps) # 12
    usc.update_cog_schema_config(apps) # 13
    usc.update_age_schema_config(apps) # 15
    usc.schemaconfig_fixes(apps) # 17
    usc.add_cot_catnum_to_schema(apps) # 18
    usc.add_tectonicunit_to_pc_in_schema_config(apps) # 20
    usc.fix_hidden_geo_prop(apps) # 21
    usc.update_schema_config_field_desc(apps) # 23
    usc.update_hidden_prop(apps) # 23
    usc.update_storage_unique_id_fields(apps) # 24

def fix_business_rules():
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        apply_default_uniqueness_rules(discipline, registry=apps)

    catnum_rule_editable(apps)

def fix_permissions():
    initialize(False, apps)
    add_permission(apps)
    add_stats_edit_permission(apps)

def fix_tectonic_ranks():
    create_default_tectonic_ranks(apps)
    create_root_tectonic_node(apps)
    fix_tectonic_unit_treedef_discipline_links(apps)

def key_migration_func_pipeline(command: BaseCommand):
    # Pipeline of key migration functions, no schema changes, only data changes
    try:
        with transaction.atomic():
            fix_cots()
            fix_permissions()
            fix_business_rules()
            fix_schema_config()
            fix_tectonic_ranks()
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise

def temp(request):
    from django.http import HttpResponse
    key_migration_func_pipeline() # remove after debugging
    return HttpResponse("Key migration functions executed successfully.")

class Command(BaseCommand):
    help = "Runs this Django command to re-run important data migrations functions"

    def handle(self, *args, **options):
        key_migration_func_pipeline(self)
