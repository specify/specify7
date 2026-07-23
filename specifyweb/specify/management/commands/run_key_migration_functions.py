import logging
from typing import Any
from collections.abc import Callable, Iterable
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import transaction
from django.db.models import Exists, OuterRef
from specifyweb.backend.businessrules.migration_utils import catnum_rule_editable
from specifyweb.backend.businessrules.uniqueness_rules import (
    apply_default_uniqueness_rules,
    fix_global_default_rules
)
from specifyweb.permissions.migration_utils.edit_permissions import add_permission, add_stats_edit_permission
from specifyweb.specify.migration_utils.default_cots import (
    create_default_collection_types,
    fix_taxon_treedef_discipline_links,
)
from specifyweb.backend.permissions.initialize import initialize
from specifyweb.specify.migration_utils.deduplication import deduplicate_schema_config_orm
from specifyweb.specify.migration_utils.migration_helpers.helper_0002_schema_config_update import create_cogtype_type_picklist, create_default_discipline_for_tree_defs, set_discipline_for_taxon_treedefs
from specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist import create_cotype_picklist
from specifyweb.specify.migration_utils.migration_helpers.helper_0004_stratigraphy_age import create_agetype_picklist
from specifyweb.specify.migration_utils.migration_helpers.helper_0007_schema_config_update import create_cogtype_picklist
from specifyweb.specify.migration_utils.migration_helpers.helper_0042_discipline_type_picklist import create_discipline_type_picklist
from specifyweb.specify.migration_utils.router import use_migration_connection
from specifyweb.specify.migration_utils.migration_helpers.helper_0031_add_default_for_selectseries import make_selectseries_false
from specifyweb.specify.migration_utils.tectonic_ranks import create_default_tectonic_ranks, create_root_tectonic_node, fix_tectonic_unit_treedef_discipline_links
from specifyweb.backend.patches.migration_utils import apply_migrations as apply_patches

logger = logging.getLogger(__name__)

MigrationFunction = Callable[[Any, Any | None], None]
WriteToStdOut = Callable[[str], None]

def log_and_run(funcs: Iterable[MigrationFunction], stdout: WriteToStdOut | None = None) -> None:
    for func in funcs:
        if stdout is not None:
            stdout(f"Running {func.__name__}...")
        func(apps)

def fix_cots(stdout: WriteToStdOut | None = None):
    funcs = [
        create_default_collection_types,
        create_default_discipline_for_tree_defs,
        create_cogtype_type_picklist,
        set_discipline_for_taxon_treedefs,
        fix_taxon_treedef_discipline_links,
        create_cotype_picklist
    ]
    log_and_run(funcs, stdout)

def apply_schema_config_defaults(stdout: WriteToStdOut | None = None):
    def apply_schema_overrides_for_all_disciplines(_apps):
        from specifyweb.backend.setup_tool.schema_defaults import apply_schema_defaults_task
        Discipline = _apps.get_model('specify', 'Discipline')
        for discipline_id, discipline_type in Discipline.objects.all().order_by('type').values_list('pk', 'type'):
            if stdout is not None:
                stdout(
                    f"Applying schema defaults/overrides for discipline {discipline_id} ({discipline_type})..."
                )
            apply_schema_defaults_task.apply(args=[discipline_id])

    funcs = [
        apply_schema_overrides_for_all_disciplines
    ]
    log_and_run(funcs, stdout)

def deduplicate_schema_config(stdout: WriteToStdOut | None = None):
    funcs = [
        deduplicate_schema_config_orm
    ]
    log_and_run(funcs, stdout)

def check_collection_picklists(stdout: WriteToStdOut | None = None):
    funcs = [
        create_agetype_picklist, # specify 0004
        create_cogtype_picklist, # specify 0007,
        create_discipline_type_picklist # specify 0042
    ]
    log_and_run(funcs, stdout)

def deduplicate_discipline_resource_dirs(apps):
    """
    De-deuplicate SpAppResourceDirs scoped to Discipline.
    We will attempt to preserve the oldest SpAppResourceDir, and will only
    remove SpAppResourceDirs that are completely empty (do not have any related
    view sets or appresources)
    """
    SpAppResourceDir = apps.get_model('specify', 'SpAppResourceDir')
    with transaction.atomic():
        common_filters = {
            "collection__isnull": True,
            "usertype__isnull": True,
            "ispersonal": False,
        }
        duplicate_dirs = SpAppResourceDir.objects.filter(
            sppersistedviewsets__isnull=True,
            sppersistedappresources__isnull=True,
            **common_filters
            ).annotate(
                earlier_exists=Exists(
                    SpAppResourceDir.objects.filter(
                        discipline_id=OuterRef('discipline_id'),
                        timestampcreated__lt=OuterRef('timestampcreated'),
                        **common_filters
                )
            )
        ).filter(earlier_exists=True)
        duplicate_dirs.delete()

def create_missing_app_resource_dirs(stdout, apps):
    from specifyweb.backend.setup_tool.app_resource_defaults import ensure_all_discipline_resource_dirs
    results = ensure_all_discipline_resource_dirs()
    if stdout is not None:
        stdout(
            "Ensured discipline app resource directories: "
            f"created={results['created']}, "
            f"updated={results['updated']}"
        )

def fix_app_resource_dirs(stdout: WriteToStdOut | None = None):
    funcs = [
        lambda apps: create_missing_app_resource_dirs(stdout, apps),
        deduplicate_discipline_resource_dirs,
    ]
    log_and_run(funcs, stdout)

def apply_default_uniqueness_rules_to_disciplines(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    UniquenessRule = apps.get_model('businessrules', 'UniquenessRule')

    for discipline in Discipline.objects.all():
        # Currently, only apply default rules to a Discipline if there no rules
        # which have isDatabaseConstraint. This caveat of this approach is if a
        # migration introduces a non-global rule where isDatabaseConstraint=True
        # then default rules will not be applied.
        # See #7413, #6308
        if not UniquenessRule.objects.filter(discipline=discipline, isDatabaseConstraint=True).exists():
            apply_default_uniqueness_rules(discipline, registry=apps)

def fix_business_rules(stdout: WriteToStdOut | None = None):
    funcs = [
        apply_default_uniqueness_rules_to_disciplines,
        catnum_rule_editable,
        fix_global_default_rules
    ]
    log_and_run(funcs, stdout)

def initialize_permissions(apps):
    initialize(wipe=False, apps=apps)

def fix_permissions(stdout: WriteToStdOut | None = None):
    funcs = [
        initialize_permissions,
        add_permission,
        add_stats_edit_permission
    ]
    log_and_run(funcs, stdout)

def fix_tectonic_ranks(stdout: WriteToStdOut | None = None):
    funcs = [
        create_default_tectonic_ranks,
        create_root_tectonic_node,
        fix_tectonic_unit_treedef_discipline_links
    ]
    log_and_run(funcs, stdout)

def fix_misc(stdout: WriteToStdOut | None = None):
    funcs = [
        make_selectseries_false # specify 0031
    ]
    log_and_run(funcs, stdout)


ALL_FUNCTIONS: dict[str, Callable[[WriteToStdOut | None], None]] = {
    "apply_patches": lambda _stdout: apply_patches(apps),
    "fix_cots": fix_cots,
    "fix_permissions": fix_permissions,
    "fix_business_rules": fix_business_rules,
    "check_collection_picklists": check_collection_picklists,
    "apply_schema_defaults": apply_schema_config_defaults,
    "deduplicate_schema_config": deduplicate_schema_config,
    "fix_app_resource_dirs": fix_app_resource_dirs,
    "fix_tectonic_ranks": fix_tectonic_ranks,
    "fix_misc": fix_misc,
}

class Command(BaseCommand):
    help = "Runs this Django command to re-run important data migrations functions"

    def add_arguments(self, parser):
        parser.add_argument(
            "functions",
            nargs="*",
            type=str,
            choices=tuple(ALL_FUNCTIONS.keys()),
            help="Optional: specify one or more functions to run",
        )
        parser.add_argument(
            "--verbose",
            action='store_true',
            dest="verbose",
            default=False,
        )

    def handle(self, *args, **options):
        functions = options.get("functions")
        verbose = options.get("verbose", False)

        try:
            with (transaction.atomic(),
                # WARNING: With this context manager, all functions will be run
                # with the Migration connection and use the Migrator user
                use_migration_connection()):
                if len(functions) > 0:
                    for function in functions:
                        if function:
                            if function not in ALL_FUNCTIONS:
                                self.stderr.write(
                                    self.style.ERROR(f"Unknown function: {function}")
                                )
                                return
                            self.stdout.write(
                                self.style.SUCCESS(f"Applying {function}...")
                            )
                            ALL_FUNCTIONS[function](self.stdout.write if verbose else None)
                else:
                    self.stdout.write(self.style.SUCCESS("Running full pipeline..."))
                    for func_name, func in ALL_FUNCTIONS.items():
                        self.stdout.write(self.style.SUCCESS(f"Applying {func_name}..."))
                        func(self.stdout.write if verbose else None)
                        self.stdout.write(self.style.SUCCESS(f"Applied {func_name}"))
        except Exception:
            logger.exception("An error occurred while running key migrations")
            raise