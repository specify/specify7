import React from 'react';

import type { PartialBy } from '../../utils/types';
import { DependentCollection } from '../DataModel/collectionApi';
import type { AnySchema } from '../DataModel/helperTypes';
import { resourceOn } from '../DataModel/resource';
import type { Collection } from '../DataModel/specifyModel';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { FormTable } from './FormTable';

export function FormTableCollection({
  collection,
  onAdd: handleAdd,
  onDelete: handleDelete,
  ...props
}: PartialBy<
  Omit<
    Parameters<typeof FormTable>[0],
    'isDependent' | 'onFetchMore' | 'relationship' | 'resources'
  >,
  'onDelete'
> & {
  readonly collection: Collection<AnySchema>;
}): JSX.Element | null {
  const [records, setRecords] = React.useState(Array.from(collection.models));
  React.useEffect(
    () =>
      resourceOn(
        collection,
        'add remove sort',
        () => setRecords(Array.from(collection.models)),
        true
      ),
    [collection]
  );

  const handleFetchMore = React.useCallback(async () => {
    await collection.fetch();
    setRecords(Array.from(collection.models));
  }, [collection]);

  const isDependent = collection instanceof DependentCollection;
  const relationship = collection.field?.getReverse();
  if (relationship === undefined) {
    console.error(
      `Trying to render a FormTableCollection on a field that does not have reverse relationship`,
      {
        field: collection.field,
        resource: collection.related,
      }
    );
    return null;
  }
  const isToOne =
    typeof relationship === 'object' && !relationshipIsToMany(relationship);
  const disableAdding = isToOne && records.length > 0;
  return (
    <FormTable
      isDependent={isDependent}
      relationship={relationship}
      resources={records}
      totalCount={collection._totalCount}
      onAdd={disableAdding ? undefined : handleAdd}
      onDelete={(resource): void => {
        collection.remove(resource);
        setRecords(Array.from(collection.models));
        handleDelete?.(resource);
      }}
      onFetchMore={collection.isComplete() ? undefined : handleFetchMore}
      {...props}
    />
  );
}
