import logging
from typing import Any
from collections.abc import Callable, Iterable
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import transaction
from specifyweb.backend.businessrules.migration_utils import catnum_rule_editable
from specifyweb.backend.businessrules.uniqueness_rules import (
    apply_default_uniqueness_rules,
    fix_global_default_rules
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

MigrationFunction = Callable[[Any, Any | None], None]

def log_and_run(funcs: Iterable[MigrationFunction], stdout = None) -> None:
    for func in funcs:
        (stdout.write if stdout is not None else logger.info)(f"Running {func.__name__}...")
        func(apps)

def fix_cots(stdout):
    funcs = [
        create_default_collection_types,
        create_default_discipline_for_tree_defs,
        create_cogtype_type_picklist,
        set_discipline_for_taxon_treedefs,
        fix_taxon_treedef_discipline_links,
        create_cotype_picklist
    ]
    log_and_run(funcs, stdout)

def fix_schema_config(stdout):
    funcs = [
        usc.create_geo_table_schema_config_with_defaults, # specify 0002
        usc.create_cotype_splocalecontaineritem, # specify 0003
        usc.create_strat_table_schema_config_with_defaults, # specify 0004 - getting skip warnings
        usc.create_agetype_picklist, # specify 0004
        usc.update_cog_type_fields, # specify 0007
        usc.create_cogtype_picklist, # specify 0007
        usc.update_cogtype_splocalecontaineritem, # specify 0007
        usc.update_systemcogtypes_picklist, # specify 0007
        usc.update_cogtype_type_splocalecontaineritem, # specify 0007
        usc.update_relative_age_fields, # specify 0008
        usc.add_cojo_to_schema_config, # specify 0012
        usc.update_cog_schema_config, # specify 0013
        usc.update_age_schema_config, # specify 0015
        usc.schemaconfig_fixes, # specify 0017
        usc.add_cot_catnum_to_schema, # specify 0018
        usc.add_tectonicunit_to_pc_in_schema_config, # specify 0020
        usc.fix_hidden_geo_prop, # specify 0021
        usc.update_schema_config_field_desc, # specify 0023
        usc.update_hidden_prop, # specify 0023
        usc.update_storage_unique_id_fields, # specify 0024
        usc.update_co_children_fields, # specify 0027
        usc.remove_collectionobject_parentco, # specify 0029
        usc.add_quantities_gift, # specify 0032
        usc.update_paleo_desc, # specify 0033
        usc.update_accession_date_fields # specify 0034
    ]
    log_and_run(funcs, stdout)

def apply_default_uniqueness_rules_to_disciplines(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    UniquenessRule = apps.get_model('businessrules', 'UniquenessRule')

    for discipline in Discipline.objects.exclude(
        id__in=set(UniquenessRule.objects.values_list('discipline_id', flat=True).distinct())):
        apply_default_uniqueness_rules(discipline, registry=apps)


def fix_business_rules(stdout):
    funcs = [
        apply_default_uniqueness_rules_to_disciplines,
        catnum_rule_editable,
        fix_global_default_rules
    ]
    log_and_run(funcs, stdout)

def initialize_permissions(apps):
    initialize(False, apps)

def fix_permissions(stdout):
    funcs = [
        initialize_permissions,
        add_permission,
        add_stats_edit_permission
    ]
    log_and_run(funcs, stdout)

def fix_tectonic_ranks(stdout):
    funcs = [
        create_default_tectonic_ranks,
        create_root_tectonic_node,
        fix_tectonic_unit_treedef_discipline_links
    ]
    log_and_run(funcs, stdout)

def fix_misc(stdout):
    funcs = [
        make_selectseries_false # specify 0031
    ]
    log_and_run(funcs, stdout)

class Command(BaseCommand):
    help = "Runs this Django command to re-run important data migrations functions"

    def add_arguments(self, parser):
        parser.add_argument(
            "function",
            nargs="?",
            type=str,
            help="Optional: specify a single function to run "
                 "(apply_patches, fix_cots, fix_permissions, fix_business_rules, "
                 "fix_schema_config, fix_tectonic_ranks, fix_misc)",
        )

    def handle(self, *args, **options):
        func_name = options.get("function")

        funcs = {
            "apply_patches": lambda _stdout: apply_patches(apps),
            "fix_cots": fix_cots,
            "fix_permissions": fix_permissions,
            "fix_business_rules": fix_business_rules,
            "fix_schema_config": fix_schema_config,
            "fix_tectonic_ranks": fix_tectonic_ranks,
            "fix_misc": fix_misc,
        }

        try:
            with transaction.atomic():
                if func_name:
                    if func_name not in funcs:
                        self.stderr.write(
                            self.style.ERROR(f"Unknown function: {func_name}")
                        )
                        return
                    self.stdout.write(
                        self.style.SUCCESS(f"Running only {func_name}...")
                    )
                    funcs[func_name](self.stdout)
                else:
                    self.stdout.write(self.style.SUCCESS("Running full pipeline..."))
                    for func_name, func in funcs.items():
                        self.stdout.write(self.style.SUCCESS(f"Applying {func_name}..."))
                        func(self.stdout)
                        self.stdout.write(self.style.SUCCESS(f"Applied {func_name}"))
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            raise
