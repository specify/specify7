from datetime import datetime
from click import BaseCommand
from specifyweb.specify.models_by_table_id import get_model_by_table_id
from specifyweb.specify.models import Spauditlog

WORKBENCH_TABLE_NUMS = {79, 80, 90, 126, 95, 81, 82}

class Command(BaseCommand):
    help = "Fix missed timestampmodified dates."

    def add_arguments(self, parser):
        parser.add_argument(
            "start_date",
            type=str,
            nargs="?",
            default="2024/06/01",
            help="Start date in YYYY/MM/DD format",
        )
        parser.add_argument(
            "end_date",
            type=str,
            nargs="?",
            default="2024/07/24",
            help="End date in YYYY/MM/DD format",
        )

    def handle(self, *args, **options):
        start_date_str = options['start_date']
        end_date_str = options['end_date']

        # Parse the date strings into datetime objects
        start_date = datetime.strptime(start_date_str, '%Y/%m/%d')
        end_date = datetime.strptime(end_date_str, '%Y/%m/%d')

        fix_missed_modified_by_dates(start_date, end_date)

def fix_missed_modified_by_dates(start_date, end_date):
    # Filter out workbench logs and logs outside the date range
    filtered_logs = Spauditlog.objects\
        .exclude(tablenum__in=WORKBENCH_TABLE_NUMS)\
        .filter(timestampmodified__range=(start_date, end_date))

    for log in filtered_logs:
        model = get_model_by_table_id(log.tablenum)
        if model is None:
            continue

        try:
            instance = model.objects.get(id=log.recordid)
        except model.DoesNotExist:
            continue

        # If the instance's timestampmodified is None or earlier than the log's timestampmodified,
        # update the instance's timestampmodified.
        if instance.timestampcreated is None or (instance.timestampcreated < log.timestampmodified):
            instance.timestampmodified = log.timestampmodified
            instance.save()