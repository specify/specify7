import csv
import json
from jsonschema import validate # type: ignore
from optparse import make_option

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from specifyweb.specify.models import Collection

from specifyweb.workbench.upload.upload import do_upload_csv
from specifyweb.workbench.upload.upload_plan_schema import schema, parse_plan

class Command(BaseCommand):
    help = 'Upload CSV to the database.'

    def add_arguments(self, parser) -> None:
        parser.add_argument('collection_id', type=int)
        parser.add_argument('upload_plan', type=str)
        parser.add_argument('csv_file', type=str)

        parser.add_argument(
            '--commit',
            action='store_true',
            dest='commit',
            default=False,
            help='Commit the changes to the database.'
        )

    def handle(self, *args, **options) -> None:
        specify_collection = Collection.objects.get(id=options['collection_id'])

        with open(options['upload_plan']) as f:
            plan = json.load(f)
        validate(plan, schema)

        with open(options['csv_file'], newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            result = do_upload_csv(specify_collection, reader, parse_plan(plan), not options['commit'])

        self.stdout.write(json.dumps([r.to_json() for r in result], indent=2))

