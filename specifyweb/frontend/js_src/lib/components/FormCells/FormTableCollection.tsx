import React from 'react';

import type { PartialBy } from '../../utils/types';
import { defined } from '../../utils/types';
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
  'onAdd' | 'onDelete'
> & {
  readonly collection: Collection<AnySchema>;
}): JSX.Element {
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
  const field = defined(collection.field?.getReverse());
  const isToOne = !relationshipIsToMany(field);
  const disableAdding = isToOne && records.length > 0;
  return (
    <FormTable
      isDependent={isDependent}
      relationship={defined(collection.field?.getReverse())}
      resources={records}
      totalCount={collection._totalCount}
      onAdd={
        disableAdding
          ? undefined
          : handleAdd ??
            ((resources): void => {
              collection.add(resources);
              setRecords(Array.from(collection.models));
            })
      }
      onDelete={(resource): void => {
        collection.remove(resource);
        setRecords(Array.from(collection.models));
        handleDelete?.(resource);
      }}
      onFetchMore={handleFetchMore}
      {...props}
    />
  );
}
