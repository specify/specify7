from django.db import connection, transaction
from django.db.models import F, Window, OuterRef, Exists
from django.apps import apps as global_apps
import logging
from django.db.models.functions import RowNumber

logger = logging.getLogger(__name__)


def deduplicate_schema_config_sql(apps=None):
    dedupe_sql = '''
    /*

    This script removes duplicate entries in the `splocalecontaineritem` table.

    The safe dedupe key is the concrete container row plus the item name:
    `SpLocaleContainerID` + `Name`.

    Why this matters:
    - Schema config containers can share the same logical table name inside a
     discipline while still being distinct rows.
    - Grouping by discipline + table name + field name can collapse valid rows
     from different containers that merely happen to share the same name.
    - Keeping the first row for a specific container/name pair preserves real
     schema config entries and only removes true duplicates.

    Any duplicate rows are deleted together with their dependent string rows.

    */


    -- 1. Identify all duplicate Container Item IDs
    -- We group by the concrete container row and the field name.
    -- Only schema-type 0 containers are eligible for this cleanup.
    -- We keep the record with the lowest ID (rn = 1) and mark the rest (rn > 1)
    CREATE TEMPORARY TABLE container_items_to_delete AS
    SELECT 
        sub.SpLocaleContainerItemID
    FROM (
        SELECT 
            slci.SpLocaleContainerItemID,
            ROW_NUMBER() OVER (
                PARTITION BY slci.SpLocaleContainerID, slci.Name 
                ORDER BY slci.SpLocaleContainerItemID ASC
            ) as rn
        FROM splocalecontaineritem slci
        JOIN splocalecontainer slc ON slci.SpLocaleContainerID = slc.SpLocaleContainerID
        WHERE slc.SchemaType = 0
    ) sub
    WHERE sub.rn > 1;

    -- 2. Delete the dependent strings first to satisfy Foreign Key constraints
    -- This handles strings linked as either 'Name' or 'Description'
    DELETE FROM splocaleitemstr 
    WHERE SpLocaleContainerItemNameID IN (SELECT SpLocaleContainerItemID FROM container_items_to_delete)
    OR SpLocaleContainerItemDescID IN (SELECT SpLocaleContainerItemID FROM container_items_to_delete);

    -- 3. Delete the duplicate Container Items
    DELETE FROM splocalecontaineritem 
    WHERE SpLocaleContainerItemID IN (SELECT SpLocaleContainerItemID FROM container_items_to_delete);

    -- 4. Clean up the temporary table
    DROP TEMPORARY TABLE container_items_to_delete;
    '''
    cursor = connection.cursor()
    cursor.execute(dedupe_sql)
    cursor.close()

def deduplicate_splocalecontainers(apps):
    Container = apps.get_model('specify', 'SpLocaleContainer')
    ContainerItem = apps.get_model('specify', 'SpLocaleContainerItem')
    ItemStr = apps.get_model('specify', 'SpLocaleItemStr')

    with transaction.atomic():
        # Find duplicate SpLocaleContainers
        # A duplicate should be in the same discipline and have the same name
        # and schematype
        # For this query we consider the oldest SpLocaleContainer as the
        # "cannonical" record, and all later records as the duplicates
        # We could be a little smarter about this and also check the associated
        # container items and strings, but this should be minimally sufficient
        # without sacrificing complexity and speed
        # See #7988
        duplicate_containers = Container.objects.filter(schematype=0).annotate(
            earlier_exists=Exists(
                Container.objects.filter(
                    discipline_id=OuterRef('discipline_id'),
                    schematype=0,
                    name=OuterRef('name'),
                    timestampcreated__lt=OuterRef('timestampcreated')
                )
            )
        ).filter(earlier_exists=True)

        # Remove the items and strings shouldn't be strictly neccesary as they
        # should both cascade if we call duplicate_containers.delete()
        # But this is the safer option for any edge cases with historical
        # models in migrations and if we ever decide to change the delete
        # behavior later down the line
        # Plus, I don't think the performance impact should be **that**
        # significantly different...
        duplicate_items = ContainerItem.objects.filter(container__in=duplicate_containers)
        ItemStr.objects.filter(itemname__in=duplicate_items).delete()
        ItemStr.objects.filter(itemdesc__in=duplicate_items).delete()
        duplicate_items.delete()

        ItemStr.objects.filter(containername__in=duplicate_containers).delete()
        ItemStr.objects.filter(containerdesc__in=duplicate_containers).delete()
        duplicate_containers.delete()

def deduplicate_containeritems_and_strings(apps):
    ContainerItem = apps.get_model('specify', 'SpLocaleContainerItem')
    ItemStr = apps.get_model('specify', 'SpLocaleItemStr')
    with transaction.atomic():
        # Identify duplicate container items using a Window function.
        # Partition by container_id + item name only.
        # Only schema type 0 containers (standard schema) are eligible for this cleanup.
        # The schema type 1 refers to the WorkBench Schema from Specify 6, which has
        # a different structure and should not be modified by this cleanup.
        #
        # Why this key:
        # - Rows are only true duplicates when they refer to the same concrete
        #   container row and the same field name.
        # - Earlier broad grouping by discipline/container-name/field-name could
        #   collapse valid rows from different containers that happened to share
        #   names, causing missing Schema Config fields after dedupe.
        # - This narrower key preserves legitimate rows and only removes
        #   duplicates that are semantically equivalent.
        qs = ContainerItem.objects.filter(
            container__schematype=0,
        ).annotate(
            rn=Window(
                expression=RowNumber(),
                partition_by=[
                    F('container_id'),
                    F('name')
                ],
                order_by=F('id').asc()
            )
        )

        # Extract the IDs of the duplicates, keep the first and delete the rest
        ids_to_delete = [item.id for item in qs if item.rn > 1]

        if ids_to_delete:
            # Delete dependent strings using corrected field names
            ItemStr.objects.filter(itemname_id__in=ids_to_delete).delete()
            ItemStr.objects.filter(itemdesc_id__in=ids_to_delete).delete()
            # Delete the duplicate Container Items
            ContainerItem.objects.filter(id__in=ids_to_delete).delete()
            print(f"Successfully deleted {len(ids_to_delete)} duplicate schema items.")
        else:
            print("No duplicates found.")

def deduplicate_schema_config_orm(apps, schema_editor=None):
    with transaction.atomic():
        deduplicate_splocalecontainers(apps)
        deduplicate_containeritems_and_strings(apps)
