from django.core.management.base import BaseCommand, CommandError

from specifyweb.specify.models import Spquery
from specifyweb.backend.export.extract_query import extract_query


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('query_id', type=int)

    def handle(self, *args, **kwargs):
        query = Spquery.objects.get(id=kwargs['query_id'])
        self.stdout.write(extract_query(query))
