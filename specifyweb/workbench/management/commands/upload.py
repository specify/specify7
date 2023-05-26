from jsonschema import validate # type: ignore
from optparse import make_option

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from specifyweb.specify import models

from specifyweb.workbench.upload.upload import do_upload_dataset
from specifyweb.workbench.upload.upload_plan_schema import schema, parse_plan
from specifyweb.workbench.models import Spdataset

Collection = getattr(models, 'Collection')
Agent = getattr(models, 'Agent')

class Command(BaseCommand):
    help = 'Upload a dataset to the database.'

    def add_arguments(self, parser) -> None:
        parser.add_argument('collection_id', type=int)
        parser.add_argument('dataset_id', type=int)
        parser.add_argument('agent_id', type=int)

        parser.add_argument(
            '--commit',
            action='store_true',
            dest='commit',
            default=False,
            help='Commit the changes to the database.'
        )

        parser.add_argument(
            '--allow-partial',
            action='store_true',
            dest='allow_partial',
            default=False,
            help='Allow partial uploads. Failing rows will be skipped.'
        )

    @transaction.atomic()
    def handle(self, *args, **options) -> None:
        specify_collection = Collection.objects.get(id=options['collection_id'])
        ds = Spdataset.objects.get(id=options['dataset_id'])
        agent = Agent.objects.get(id=options['agent_id'])
        do_upload_dataset(specify_collection, agent.id, ds, not options['commit'], options['allow_partial'])
