import json
from optparse import make_option

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from specifyweb.specify import models

from specifyweb.workbench.upload.upload import clear_disambiguation
from specifyweb.workbench.models import Spdataset


class Command(BaseCommand):
    help = 'Remove all disambiguation data from a dataset.'

    def add_arguments(self, parser) -> None:
        parser.add_argument('dataset_id', type=int)

    def handle(self, *args, **options) -> None:
        ds = Spdataset.objects.get(id=options['dataset_id'])
        clear_disambiguation(ds)
