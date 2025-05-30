import React from 'react';

import type { CollectionFetchFilters } from '../DataModel/collection';
import { DependentCollection } from '../DataModel/collectionApi';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Collection } from '../DataModel/specifyTable';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { FormTable } from './FormTable';

export function FormTableCollection({
  collection,
  onAdd: handleAdd,
  onDelete: handleDelete,
  onFetchMore: handleFetch,
  disableRemove,
  ...props
}: Omit<
  Parameters<typeof FormTable>[0],
  'isDependent' | 'onDelete' | 'onFetchMore' | 'relationship' | 'resources'
> & {
  readonly collection: Collection<AnySchema>;
  readonly onDelete:
    | ((resource: SpecifyResource<AnySchema>, index: number) => void)
    | undefined;
  readonly onFetchMore?: (
    filters?: CollectionFetchFilters<AnySchema>
  ) => Promise<Collection<AnySchema> | undefined>;
  readonly disableRemove?: boolean;
}): JSX.Element | null {
  const [records, setRecords] = React.useState(Array.from(collection.models));
  React.useEffect(
    () =>
      resourceOn(
        collection,
        'add remove sort sync',
        () => setRecords(Array.from(collection.models)),
        true
      ),
    [collection]
  );

  const handleFetchMore = React.useCallback(async () => {
    await (typeof handleFetch === 'function'
      ? handleFetch()
      : collection.fetch());
    setRecords(Array.from(collection.models));
  }, [collection, handleFetch]);

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
      collection={collection}
      disableRemove={disableRemove}
      isDependent={isDependent}
      relationship={relationship}
      resources={records}
      totalCount={collection._totalCount}
      onAdd={disableAdding ? undefined : handleAdd}
      onDelete={(resource): void => {
        setRecords(Array.from(collection.models));
        handleDelete?.(resource, records.indexOf(resource));
      }}
      onFetchMore={collection.isComplete() ? undefined : handleFetchMore}
      {...props}
    />
  );
}
