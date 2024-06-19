import React from 'react';

import { reportsText } from '../../localization/report';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import { booleanFormatter } from '../../utils/parser/parse';
import type { RA, RR } from '../../utils/types';
import { ensure } from '../../utils/types';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { getField } from '../DataModel/helpers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import { TableIcon } from '../Molecules/TableIcon';
import { localizedRelationshipTypes } from '../SchemaConfig/helpers';
import type { SchemaViewerRow, SchemaViewerValue } from './helpers';
import { SchemaViewerTableList } from './TableList';

export function SchemaViewerRelationships({
  table,
}: {
  readonly table: SpecifyTable;
}): JSX.Element {
  const data = React.useMemo(() => getRelationships(table), [table]);

  const [dependentFilter, setDependentFilter] = React.useState<
    boolean | undefined
  >(undefined);

  const filteredDependentData = React.useMemo(
    () =>
      typeof dependentFilter === 'boolean'
        ? data.filter(
            (relationship: { readonly name: string }) =>
              table.strictGetRelationship(relationship.name).isDependent() ===
              dependentFilter
          )
        : data,
    [dependentFilter]
  );

  return (
    <>
      <div className="flex items-center gap-4">
        <H3 id={table.name.toLowerCase()}>{schemaText.relationships()}</H3>
        <div className="flex items-center gap-2">
          <Button.Small
            aria-pressed={
              dependentFilter === true || dependentFilter === undefined
            }
            onClick={(): void =>
              setDependentFilter(
                dependentFilter === undefined
                  ? true
                  : dependentFilter
                  ? undefined
                  : true
              )
            }
          >
            {schemaText.dependent()}
          </Button.Small>
          <Button.Small
            aria-pressed={
              dependentFilter === false || dependentFilter === undefined
            }
            onClick={(): void =>
              setDependentFilter(
                dependentFilter === undefined
                  ? false
                  : dependentFilter
                  ? false
                  : undefined
              )
            }
          >
            {schemaText.independent()}
          </Button.Small>
        </div>
      </div>
      <SchemaViewerTableList
        data={filteredDependentData}
        getLink={({ relatedTable }): string => `#${relatedTable?.[0]}`}
        headers={relationshipColumns()}
        sortName="schemaViewerRelationships"
      />
    </>
  );
}

const relationshipColumns = f.store(
  () =>
    ({
      name: getField(tables.SpLocaleContainerItem, 'name').label,
      label: reportsText.labels(),
      description: schemaText.description(),
      isHidden: getField(tables.SpLocaleContainerItem, 'isHidden').label,
      isReadOnly: schemaText.readOnly(),
      isRequired: getField(tables.SpLocaleContainerItem, 'isRequired').label,
      type: getField(tables.SpLocaleContainerItem, 'type').label,
      databaseColumn: schemaText.databaseColumn(),
      relatedTable: schemaText.relatedTable(),
      otherSideName: schemaText.otherSideName(),
      isDependent: schemaText.dependent(),
    } as const)
);

const getRelationships = (table: SpecifyTable) =>
  ensure<
    RA<
      SchemaViewerRow<
        RR<keyof ReturnType<typeof relationshipColumns>, SchemaViewerValue>
      >
    >
  >()(
    table.relationships.map(
      (field) =>
        ({
          name: field.name,
          label: field.label,
          description: field.getLocalizedDesc(),
          isHidden: booleanFormatter(field.isHidden),
          isReadOnly: booleanFormatter(field.isReadOnly),
          isRequired: booleanFormatter(field.isRequired),
          type: localizedRelationshipTypes[field.type] ?? field.type,
          databaseColumn: field.databaseColumn,
          relatedTable: [
            field.relatedTable.name.toLowerCase(),
            <>
              <TableIcon label={false} name={field.relatedTable.name} />
              {field.relatedTable.name}
            </>,
          ],
          otherSideName: field.otherSideName,
          isDependent: booleanFormatter(field.isDependent()),
        } as const)
    )
  );
