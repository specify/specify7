import React from 'react';

import { f } from '../../utils/functools';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyTable';
import { getTable } from '../DataModel/tables';
import type { PickList } from '../DataModel/types';
import { IntegratedRecordSelector } from '../FormSliders/IntegratedRecordSelector';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

export function PickListEditor({
  resource,
  relationship,
}: {
  readonly resource: SpecifyResource<PickList>;
  readonly relationship: Relationship;
}): JSX.Element | null {
  const [tableName, setTableName] = React.useState<string | null>(null);
  React.useEffect(
    () =>
      resourceOn(
        resource,
        'change:tableName',
        () => setTableName(resource.get('tableName')),
        true
      ),
    [resource]
  );

  const table =
    tableName === null || tableName === undefined
      ? undefined
      : getTable(tableName);

  const collection = React.useMemo(
    () =>
      (table === undefined
        ? undefined
        : new table.LazyCollection({
            domainfilter: true,
          })) as Collection<AnySchema>,
    [table]
  );

  return collection === undefined ? null : (
    <IntegratedRecordSelector
      collection={collection}
      dialog={false}
      formType="form"
      relationship={relationship}
      sortField={undefined}
      onAdd={
        relationshipIsToMany(relationship) &&
        relationship.type !== 'zero-to-one'
          ? undefined
          : ([resource]): void =>
              void resource.set(relationship.name, resource as never)
      }
      onClose={f.never}
    />
  );
}
