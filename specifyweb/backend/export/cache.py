"""Cache table operations for DwC export pipeline."""
import logging
import re
from django.db import connection

from .dwca_utils import sanitize_column_name

logger = logging.getLogger(__name__)


def get_cache_table_name(mapping_id, collection_id, prefix='dwc_cache'):
    """Generate a safe cache table name."""
    return f'{prefix}_{mapping_id}_{collection_id}'


def create_cache_table(table_name, columns):
    """Create a cache table with the given columns.

    columns: list of (column_name, column_type) tuples.
    An auto-increment primary key is always added.
    """
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '', table_name)
    col_defs = ', '.join(
        f'`{re.sub(r"[^a-zA-Z0-9_]", "", name)}` {col_type}'
        for name, col_type in columns
    )
    with connection.cursor() as cursor:
        cursor.execute(f'DROP TABLE IF EXISTS `{safe_name}`')
        cursor.execute(
            f'CREATE TABLE `{safe_name}` ('
            f'`id` INT AUTO_INCREMENT PRIMARY KEY, {col_defs}'
            f') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        )
    logger.info('Created cache table %s', safe_name)


def drop_cache_table(table_name):
    """Drop a cache table if it exists."""
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '', table_name)
    with connection.cursor() as cursor:
        cursor.execute(f'DROP TABLE IF EXISTS `{safe_name}`')
    logger.info('Dropped cache table %s', safe_name)


def build_cache_tables(export_dataset, user=None, progress_callback=None):
    """Build cache tables for an ExportDataSet's core mapping and all extensions."""
    core_mapping = export_dataset.coremapping
    collection = export_dataset.collection

    _build_single_cache(core_mapping, collection, user=user,
                        progress_callback=progress_callback)

    for ext in export_dataset.extensions.all().order_by('sortorder').iterator(chunk_size=2000):
        _build_single_cache(ext.schemamapping, collection,
                            prefix=f'dwc_cache_ext{ext.sortorder}',
                            user=user, progress_callback=progress_callback)


def _build_single_cache(mapping, collection, prefix='dwc_cache', user=None,
                        progress_callback=None):
    """Build a single cache table for one SchemaMapping."""
    from .models import CacheTableMeta
    from django.utils import timezone

    table_name = get_cache_table_name(mapping.id, collection.id, prefix)

    meta, _ = CacheTableMeta.objects.update_or_create(
        schemamapping=mapping,
        defaults={'tablename': table_name, 'buildstatus': 'building'}
    )

    try:
        display_fields = [
            f for f in mapping.query.fields.order_by('position')
            if getattr(f, 'term', None)
        ]

        columns = [
            (sanitize_column_name(f.term), _infer_column_type(f))
            for f in display_fields
        ]

        create_cache_table(table_name, columns)

        rowcount = _execute_and_populate(
            table_name, mapping, collection, user, progress_callback
        )

        meta.buildstatus = 'idle'
        meta.lastbuilt = timezone.now()
        meta.rowcount = rowcount
        meta.save()

        logger.info('Cache table %s built with %d rows', table_name, rowcount)

    except Exception:
        meta.buildstatus = 'error'
        meta.save()
        logger.exception('Failed to build cache table %s', table_name)
        raise


def _execute_and_populate(table_name, mapping, collection, user, progress_callback=None):
    """Execute a mapping's query and INSERT results into the cache table.

    Uses SQLAlchemy build_query() to ensure output matches query_to_csv
    (date formatting, null replacement, etc.), then batch-INSERTs rows.

    Returns the number of rows inserted.
    """
    from specifyweb.backend.stored_queries.execution import (
        build_query, BuildQueryProps, set_group_concat_max_len,
        apply_special_post_query_processing,
    )
    from specifyweb.backend.stored_queries.queryfield import QueryField
    from specifyweb.backend.stored_queries.models import session_context
    from .field_adapter import EphemeralFieldAdapter

    query_obj = mapping.query
    display_fields = [
        f for f in query_obj.fields.order_by('position')
        if getattr(f, 'term', None)
    ]
    field_specs = [
        QueryField.from_spqueryfield(EphemeralFieldAdapter(f, force_display=True))
        for f in display_fields
    ]

    safe_name = re.sub(r'[^a-zA-Z0-9_]', '', table_name)
    col_count = len(display_fields)
    placeholders = ', '.join(['%s'] * col_count)
    col_names = ', '.join(
        f'`{sanitize_column_name(f.term)}`'
        for f in display_fields
    )
    insert_sql = f'INSERT INTO `{safe_name}` ({col_names}) VALUES ({placeholders})'

    total = 0
    BATCH_SIZE = 2000

    with session_context() as session:
        set_group_concat_max_len(session.connection())
        sa_query, _ = build_query(
            session, collection, user,
            query_obj.contexttableid,
            field_specs,
            BuildQueryProps(
                replace_nulls=True,
                date_format_override='%Y-%m-%d',
            ),
        )
        sa_query = apply_special_post_query_processing(
            sa_query, query_obj.contexttableid, field_specs, collection, user,
            should_list_query=False,
        )

        batch = []
        if isinstance(sa_query, list):
            iterator = iter(sa_query)
        else:
            iterator = sa_query.yield_per(BATCH_SIZE)

        for row in iterator:
            batch.append(tuple(
                str(v) if v is not None else '' for v in row[1:]
            ))

            if len(batch) >= BATCH_SIZE:
                with connection.cursor() as cursor:
                    cursor.executemany(insert_sql, batch)
                total += len(batch)
                batch = []
                if progress_callback:
                    progress_callback(total, None)

        if batch:
            with connection.cursor() as cursor:
                cursor.executemany(insert_sql, batch)
            total += len(batch)

    if progress_callback:
        progress_callback(total, total)

    return total


def _infer_column_type(spqueryfield):
    """Infer a MySQL column type from a Specify query field."""
    fname = (spqueryfield.fieldname or '').lower()

    if 'guid' in fname or 'uuid' in fname:
        return 'VARCHAR(256)'
    if fname in ('id', 'rankid', 'number1', 'number2', 'countamt',
                 'sortorder', 'position', 'version'):
        return 'INT'
    if 'numericyear' in fname or 'numericmonth' in fname or 'numericday' in fname:
        return 'INT'
    if fname in ('latitude1', 'latitude2', 'longitude1', 'longitude2',
                 'latlongaccuracy', 'maxelevation', 'minelevation'):
        return 'DECIMAL(12,6)'
    if fname in ('startdate', 'enddate', 'determineddate', 'catalogeddate',
                 'timestampcreated', 'timestampmodified'):
        return 'VARCHAR(32)'
    if fname.startswith('is') or fname.startswith('yes'):
        return 'VARCHAR(8)'
    if fname in ('catalognumber', 'altcatalognumber', 'barcode', 'fieldnumber',
                 'code', 'abbreviation', 'datum'):
        return 'VARCHAR(256)'
    return 'TEXT'
