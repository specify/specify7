import React from 'react';

import { reportsText } from '../../localization/report';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import { booleanFormatter } from '../../utils/parser/parse';
import type { RA, RR } from '../../utils/types';
import { ensure } from '../../utils/types';
import { H2 } from '../Atoms';
import { formatNumber } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { getField } from '../DataModel/helpers';
import { genericTables, getTable, tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { SchemaViewerFields } from './Fields';
import type { SchemaViewerRow, SchemaViewerValue } from './helpers';
import { schemaViewerTopId } from './index';
import { SchemaViewerRelationships } from './Relationships';

export function SchemaViewerTable({
  tableName,
  forwardRef,
}: {
  readonly tableName: keyof Tables;
  readonly forwardRef?: (element: HTMLElement | null) => void;
}): JSX.Element {
  const table = getTable(tableName);
  return table === undefined ? (
    <NotFoundView />
  ) : (
    <section
      className="flex flex-col gap-4 print:m-8 print:text-xs"
      ref={forwardRef}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <TableIcon label={false} name={table.name} />
          <H2 className="text-2xl" id={table.name.toLowerCase()}>
            {table.name}
          </H2>
        </div>
        <Link.Default href={`#${schemaViewerTopId}`}>
          {schemaText.goToTop()}
        </Link.Default>
      </div>
      <SchemaViewerFields table={table} />
      <SchemaViewerRelationships table={table} />
    </section>
  );
}

export const schemaViewerTableColumns = f.store(
  () =>
    ({
      name: getField(tables.SpLocaleContainer, 'name').label,
      label: reportsText.labels(),
      isSystem: getField(tables.SpLocaleContainer, 'isSystem').label,
      isHidden: getField(tables.SpLocaleContainer, 'isHidden').label,
      tableId: schemaText.tableId(),
      fieldCount: schemaText.fieldCount(),
      relationshipCount: schemaText.relationshipCount(),
    }) as const
);

export const getSchemaViewerTables = () =>
  ensure<
    RA<
      SchemaViewerRow<
        RR<keyof ReturnType<typeof schemaViewerTableColumns>, SchemaViewerValue>
      >
    >
  >()(
    Object.values(genericTables).map(
      (table) =>
        ({
          name: [
            table.name.toLowerCase(),
            <>
              <TableIcon label={false} name={table.name} />
              {table.name}
            </>,
          ],
          label: table.label,
          isSystem: booleanFormatter(table.isSystem),
          isHidden: booleanFormatter(table.isHidden),
          tableId: [
            table.tableId,
            <span className="flex w-full justify-end tabular-nums" key="">
              {table.tableId}
            </span>,
          ],
          fieldCount: [
            table.fields.length,
            <span className="flex w-full justify-end tabular-nums" key="">
              {formatNumber(table.fields.length)}
            </span>,
          ],
          relationshipCount: [
            table.relationships.length,
            <span className="flex w-full justify-end tabular-nums" key="">
              {formatNumber(table.relationships.length)}
            </span>,
          ],
        }) as const
    )
  );
