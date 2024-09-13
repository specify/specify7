import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import {
  DependentCollection,
  isRelationshipCollection,
  LazyCollection,
} from '../DataModel/collectionApi';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyTable';
import { raise } from '../Errors/Crash';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import type {
  RecordSelectorProps,
  RecordSelectorState,
} from './RecordSelector';
import { useRecordSelector } from './RecordSelector';

export function RecordSelectorFromCollection<SCHEMA extends AnySchema>({
  collection,
  relationship,
  onAdd: handleAdd,
  onDelete: handleDelete,
  onSlide: handleSlide,
  children,
  defaultIndex = 0,
  ...rest
}: Omit<
  RecordSelectorProps<SCHEMA>,
  | 'index'
  | 'isDependent'
  | 'onAdd'
  | 'onDelete'
  | 'records'
  | 'relatedResource'
  | 'table'
> &
  Partial<Pick<RecordSelectorProps<SCHEMA>, 'onAdd' | 'onDelete'>> & {
    readonly collection: Collection<SCHEMA>;
    readonly relationship: Relationship;
    readonly defaultIndex?: number;
    readonly children: (state: RecordSelectorState<SCHEMA>) => JSX.Element;
  }): JSX.Element | null {
  const getRecords = React.useCallback(
    (): RA<SpecifyResource<SCHEMA> | undefined> =>
      Array.from(collection.models),
    [collection]
  );
  const [records, setRecords] =
    React.useState<RA<SpecifyResource<SCHEMA> | undefined>>(getRecords);

  const isDependent = collection instanceof DependentCollection;
  const isLazy = collection instanceof LazyCollection;
  const isToOne =
    !relationshipIsToMany(relationship) || relationship.type === 'zero-to-one';

  // Listen for changes to collection
  React.useEffect(
    () =>
      resourceOn(
        collection,
        'add remove destroy sync',
        (): void => setRecords(getRecords),
        true
      ),
    [collection, getRecords]
  );

  const [index, setIndex] = useTriggerState(Math.max(0, defaultIndex));

  // Fetch records if needed
  React.useEffect(() => {
    /*
     * BUG: make this more efficient (if going to the last record,
     *   don't need to fetch all records in between)
     */
    if (
      !isToOne &&
      isLazy &&
      collection.related?.isNew() !== true &&
      !collection.isComplete() &&
      collection.models[index] === undefined
    )
      collection
        .fetch()
        .then(() => setRecords(getRecords))
        .catch(raise);
  }, [collection, isLazy, getRecords, index, records.length, isToOne]);

  const state = useRecordSelector({
    ...rest,
    index,
    table: collection.table.specifyTable,
    field: relationship,
    records,
    relatedResource: isRelationshipCollection(collection)
      ? collection.related
      : undefined,
    totalCount: collection._totalCount ?? records.length,
    onAdd: (rawResources): void => {
      const resources = isToOne ? rawResources.slice(0, 1) : rawResources;
      if (isDependent && isToOne)
        collection.related?.placeInSameHierarchy(resources[0]);
      handleAdd?.(resources);
      const lastIndex = Math.max(0, collection.models.length - 1);
      setIndex(lastIndex);
      handleSlide?.(lastIndex, false);
      // Updates the state to trigger a reRender
      setRecords(getRecords);
    },
    onDelete: (_index, source): void => {
      collection.remove(
        defined(
          records[index],
          `Trying to remove a record with index ${index} which doesn't exists`
        )
      );
      handleDelete?.(index, source);
      setRecords(getRecords);
    },
    onSlide: (index, replace, callback): void => {
      setIndex(index);
      handleSlide?.(index, replace);
      callback?.();
    },
  });

  return children(state);
}
