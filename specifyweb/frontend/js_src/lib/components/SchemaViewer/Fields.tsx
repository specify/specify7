import React from 'react';

import { commonText } from '../../localization/common';
import { reportsText } from '../../localization/report';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import { booleanFormatter } from '../../utils/parser/parse';
import type { RA, RR } from '../../utils/types';
import { ensure } from '../../utils/types';
import { H3 } from '../Atoms';
import { formatNumber } from '../Atoms/Internationalization';
import { getField } from '../DataModel/helpers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import { javaTypeToHuman } from '../SchemaConfig/helpers';
import type { SchemaViewerRow, SchemaViewerValue } from './helpers';
import { SchemaViewerTableList } from './TableList';

export function SchemaViewerFields({
  table,
}: {
  readonly table: SpecifyTable;
}): JSX.Element {
  const data = React.useMemo(() => getFields(table), [table]);
  const scope = table.getScopingRelationship()?.relatedTable.name;

  return (
    <>
      <p>
        {commonText.colonLine({
          label: schemaText.idField(),
          value: table.idField.name,
        })}
      </p>
      {typeof scope === 'string' && (
        <p>
          {commonText.colonLine({
            label: schemaText.scope(),
            value: scope,
          })}
        </p>
      )}
      <H3>{schemaText.fields()}</H3>
      <SchemaViewerTableList
        data={data}
        getLink={undefined}
        headers={fieldColumns()}
        sortName="schemaViewerFields"
      />
    </>
  );
}

const fieldColumns = f.store(
  () =>
    ({
      name: getField(tables.SpLocaleContainerItem, 'name').label,
      label: reportsText.labels(),
      description: schemaText.description(),
      isHidden: getField(tables.SpLocaleContainerItem, 'isHidden').label,
      isReadOnly: schemaText.readOnly(),
      isRequired: getField(tables.SpLocaleContainerItem, 'isRequired').label,
      type: getField(tables.SpLocaleContainerItem, 'type').label,
      length: schemaText.fieldLength(),
      databaseColumn: schemaText.databaseColumn(),
    }) as const
);

const getFields = (table: SpecifyTable) =>
  ensure<
    RA<
      SchemaViewerRow<
        RR<keyof ReturnType<typeof fieldColumns>, SchemaViewerValue>
      >
    >
  >()(
    table.literalFields.map(
      (field) =>
        ({
          name: field.name,
          label: field.label,
          description: field.getLocalizedDesc(),
          isHidden: booleanFormatter(field.isHidden),
          isReadOnly: booleanFormatter(field.isReadOnly),
          isRequired: booleanFormatter(field.isRequired),
          type: javaTypeToHuman(field.type, undefined),
          length: [
            field.length,
            <span className="flex w-full justify-end tabular-nums" key="">
              {f.maybe(field.length, formatNumber)}
            </span>,
          ],
          databaseColumn: field.databaseColumn,
        }) as const
    )
  );
