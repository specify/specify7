import logging
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import transaction
from specifyweb.backend.businessrules.migration_utils import catnum_rule_editable
from specifyweb.backend.businessrules.uniqueness_rules import (
    apply_default_uniqueness_rules,
    create_uniqueness_rule
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
from specifyweb.backend.permissions.initialize import initialize
from specifyweb.specify.migration_utils import update_schema_config as usc
from specifyweb.specify.migration_utils.misc_migrations import make_selectseries_false
from specifyweb.specify.migration_utils.tectonic_ranks import create_default_tectonic_ranks, create_root_tectonic_node
from specifyweb.backend.patches.migration_utils import apply_migrations as apply_patches

logger = logging.getLogger(__name__)

def fix_cots():
    create_default_collection_types(apps)
    create_default_discipline_for_tree_defs(apps)
    create_cogtype_type_picklist(apps)
    set_discipline_for_taxon_treedefs(apps)
    fix_taxon_treedef_discipline_links(apps)
    create_cotype_picklist(apps)

def fix_schema_config():
    usc.create_geo_table_schema_config_with_defaults(apps) # specify 0002
    usc.create_cotype_splocalecontaineritem(apps) # specify 0003
    usc.create_strat_table_schema_config_with_defaults(apps) # specify 0004 - getting skip warnings
    usc.create_agetype_picklist(apps) # specify 0004
    usc.update_cog_type_fields(apps) # specify 0007
    usc.create_cogtype_picklist(apps) # specify 0007
    usc.update_cogtype_splocalecontaineritem(apps) # specify 0007
    usc.update_systemcogtypes_picklist(apps) # specify 0007
    usc.update_cogtype_type_splocalecontaineritem(apps) # specify 0007
    usc.update_relative_age_fields(apps) # specify 0008
    usc.add_cojo_to_schema_config(apps) # specify 0012
    usc.update_cog_schema_config(apps) # specify 0013
    usc.update_age_schema_config(apps) # specify 0015
    usc.schemaconfig_fixes(apps) # specify 0017
    usc.add_cot_catnum_to_schema(apps) # specify 0018
    usc.add_tectonicunit_to_pc_in_schema_config(apps) # specify 0020
    usc.fix_hidden_geo_prop(apps) # specify 0021
    usc.update_schema_config_field_desc(apps) # specify 0023
    usc.update_hidden_prop(apps) # specify 0023
    usc.update_storage_unique_id_fields(apps) # specify 0024
    usc.update_co_children_fields(apps) # specify 0027
    usc.remove_collectionobject_parentco(apps) # specify 0029
    usc.add_quantities_gift(apps) # specify 0032
    usc.update_paleo_desc(apps) # specify 0033
    usc.update_accession_date_fields(apps) # specify 0034

def fix_business_rules():
    Discipline = apps.get_model('specify', 'Discipline')
    UniquenessRule = apps.get_model('businessrules', 'UniquenessRule')

    # Maybe not wanted for sp6 to sp7 migrations, don't want to create default uniqueness rules again after deleting.
    # for discipline in Discipline.objects.exclude(
    #     id__in=set(UniquenessRule.objects.values_list('discipline_id', flat=True).distinct())):
    for discipline in Discipline.objects.all():
        apply_default_uniqueness_rules(discipline, registry=apps)

        # UniquenessRule = apps.get_model('businessrules', 'UniquenessRule')
        create_uniqueness_rule("Collectionobjectgroupjoin", discipline, True, ["childCo", "childCog"], [], apps)
        create_uniqueness_rule("Storage", discipline, True, ["uniqueIdentifier"], [], apps)

    catnum_rule_editable(apps)
    create_uniqueness_rule("Storage", None, True, ["uniqueIdentifier"], [], apps)

def fix_permissions():
    initialize(False, apps)
    add_permission(apps)
    add_stats_edit_permission(apps)

def fix_tectonic_ranks():
    create_default_tectonic_ranks(apps)
    create_root_tectonic_node(apps)
    fix_tectonic_unit_treedef_discipline_links(apps)

def fix_misc():
    make_selectseries_false(apps) # specify 0031

def key_migration_func_pipeline(command: BaseCommand):
    # Pipeline of key migration functions, no schema changes, only data changes
    try:
        with transaction.atomic():
            apply_patches(apps)
            fix_cots()
            fix_permissions()
            fix_business_rules()
            fix_schema_config()
            fix_tectonic_ranks()
            fix_misc()
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
