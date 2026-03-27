from django.core.management.base import BaseCommand, CommandError
from django.apps import apps

from specifyweb.specify.migration_utils import update_schema_config as update_schema


class Command(BaseCommand):
    help = "Finds missing schema config fields for a discipline and can create them."

    def add_arguments(self, parser):
        parser.add_argument(
            "--discipline-id",
            type=int,
            dest="discipline_id",
            required=True,
            help="Discipline ID to target.",
        )
        parser.add_argument(
            "--apply",
            action="store_true",
            dest="apply",
            default=False,
            help="Create any missing schema config records.",
        )
        parser.add_argument(
            "--verbose",
            action="store_true",
            dest="verbose",
            default=False,
            help="Print each create operation as it runs.",
        )

    def handle(self, **options):
        discipline_id = options.get("discipline_id")
        apply_changes = options.get("apply", False)
        verbose = options.get("verbose", False)

        # Resolve the discipline by given ID
        Discipline = apps.get_model("specify", "Discipline")
        try:
            discipline = Discipline.objects.get(id=discipline_id)
        except Discipline.DoesNotExist as exc:
            raise CommandError(
                f"Discipline with ID {discipline_id} not found."
            ) from exc

        self.stdout.write(
            f"Discipline: {discipline.name} (ID={discipline.id})"
        )

        missing_tables, missing_fields = update_schema.find_missing_schema_config_fields(discipline.id, apps=apps,)

        if not missing_tables and not missing_fields:
            self.stdout.write("No missing schema config fields found.")
            return

        # Print out what would be created if applied.
        if missing_tables:
            self.stdout.write("Missing table containers:")
            for table_name in sorted(missing_tables):
                self.stdout.write(f"- {table_name}")

        if missing_fields:
            self.stdout.write("Missing fields:")
            for table_name in sorted(missing_fields.keys()):
                field_names = missing_fields[table_name]
                if not field_names:
                    continue
                joined_fields = ", ".join(field_names)
                self.stdout.write(f"- {table_name}: {joined_fields}")

        if not apply_changes:
            self.stdout.write("Run again with --apply to create missing records.")
            return

        # Apply changes
        update_schema.create_missing_schema_config_fields(
            discipline.id,
            apps=apps,
            stdout=self.stdout.write if verbose else None,
        )
        self.stdout.write("Applied missing schema config records.")
