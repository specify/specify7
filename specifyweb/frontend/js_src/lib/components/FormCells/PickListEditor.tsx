import React from 'react';
import { IntegratedRecordSelector } from '../FormSliders/IntegratedRecordSelector';
import { getModel } from '../DataModel/schema';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { Collection } from '../DataModel/specifyModel';
import { Relationship } from '../DataModel/specifyField';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { PickList } from '../DataModel/types';
import { f } from '../../utils/functools';
import { resourceOn } from '../DataModel/resource';

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

  const table = tableName === null ? undefined : getModel(tableName);

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
      formType={'form'}
      mode={'edit'}
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
