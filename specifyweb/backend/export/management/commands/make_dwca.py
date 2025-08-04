import logging

from django.core.management.base import BaseCommand

from specifyweb.context.app_resource import get_app_resource
from specifyweb.backend.export.dwca import make_dwca
from specifyweb.specify.models import Specifyuser, Collection

logger = logging.getLogger(__name__)


class Command(BaseCommand):

    def add_arguments(self, parser):
        definition = parser.add_mutually_exclusive_group(required=True)
        definition.add_argument('--resource', help='DwCA definition resource name')
        definition.add_argument('--definition', help='DwCA definition file')

        metadata = parser.add_mutually_exclusive_group()
        metadata.add_argument('--metadata', help='Metadata resource name')
        metadata.add_argument('--eml', help='Metadata eml file')

        parser.add_argument('collection_id', type=int)
        parser.add_argument('specifyuser_id', type=int)
        parser.add_argument('output_file')

    def handle(self, *args, **kwargs):
        collection = Collection.objects.get(id=kwargs['collection_id'])
        user = Specifyuser.objects.get(id=kwargs['specifyuser_id'])

        if kwargs['definition'] != None:
            with open(kwargs['definition']) as f:
                definition = f.read()
        else:
            definition, _, __ = get_app_resource(collection, user, kwargs['resource'])

        if kwargs['eml'] != None:
            with open(kwargs['eml']) as f:
                eml = f.read()
        elif kwargs['metadata'] != None:
            eml, _, __ = get_app_resource(collection, user, kwargs['metadata'])
        else:
            eml = None

        make_dwca(collection, user, definition, kwargs['output_file'], eml=eml)
