import logging
from django.core.management.base import BaseCommand
from django.apps import apps
from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify.utils import create_default_collection_types

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Create default COTS for the Specify database if they haven't been previously set."

    def handle(self, *args, **options):
        create_default_collection_types(apps)
