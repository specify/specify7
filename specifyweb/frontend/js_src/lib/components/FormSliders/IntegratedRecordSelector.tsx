import React from 'react';

import { useSearchParameter } from '../../hooks/navigation';
import { useTriggerState } from '../../hooks/useTriggerState';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { DataEntry } from '../Atoms/DataEntry';
import { ReadOnlyContext } from '../Core/Contexts';
import {
  DependentCollection,
  LazyCollection,
} from '../DataModel/collectionApi';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyTable';
import { raise } from '../Errors/Crash';
import { FormTableCollection } from '../FormCells/FormTableCollection';
import type { FormType } from '../FormParse';
import type { SubViewSortField } from '../FormParse/cells';
import { augmentMode, ResourceView } from '../Forms/ResourceView';
import { hasTablePermission } from '../Permissions/helpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import type {
  RecordSelectorProps,
  RecordSelectorState,
} from './RecordSelector';
import { useRecordSelector } from './RecordSelector';

// REFACTOR: encapsulate common logic from FormTableCollection and this component
/** A wrapper for RecordSelector to integrate with Backbone.Collection */
function RecordSelectorFromCollection<SCHEMA extends AnySchema>({
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
  | 'totalCount'
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
        'add remove destroy',
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
      isLazy &&
      collection.related?.isNew() !== true &&
      !collection.isComplete() &&
      collection.models[index] === undefined
    )
      collection
        .fetch()
        .then(() => setRecords(getRecords))
        .catch(raise);
  }, [collection, isLazy, getRecords, index, records.length]);

  const state = useRecordSelector({
    ...rest,
    index,
    table: collection.table.specifyTable,
    records,
    relatedResource: isDependent ? collection.related : undefined,
    totalCount: collection._totalCount ?? records.length,
    onAdd: (rawResources): void => {
      const resources = isToOne ? rawResources.slice(0, 1) : rawResources;
      if (isDependent && isToOne)
        collection.related?.placeInSameHierarchy(resources[0]);
      collection.add(resources);
      handleAdd?.(resources);
      setIndex(collection.models.length - 1);
      handleSlide?.(collection.models.length - 1, false);
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

export function IntegratedRecordSelector({
  urlParameter,
  viewName,
  collection,
  dialog,
  onClose: handleClose,
  formType,
  sortField,
  relationship,
  ...rest
}: Omit<
  Parameters<typeof RecordSelectorFromCollection>[0],
  'children' | 'onSlide' | 'table'
> & {
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly formType: FormType;
  readonly viewName?: string;
  readonly urlParameter?: string;
  readonly onClose: () => void;
  readonly sortField: SubViewSortField | undefined;
}): JSX.Element {
  const isDependent = collection instanceof DependentCollection;
  const isToOne =
    !relationshipIsToMany(relationship) || relationship.type === 'zero-to-one';
  const isReadOnly = augmentMode(
    React.useContext(ReadOnlyContext),
    false,
    relationship.relatedTable.name
  );

  const [rawIndex, setIndex] = useSearchParameter(urlParameter);
  const index = f.parseInt(rawIndex) ?? 0;
  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      {formType === 'formTable' ? (
        <FormTableCollection
          collection={collection}
          dialog={dialog}
          sortField={sortField}
          viewName={viewName}
          onAdd={undefined}
          onClose={handleClose}
          onDelete={undefined}
        />
      ) : (
        <RecordSelectorFromCollection
          collection={collection}
          defaultIndex={isToOne ? 0 : index}
          relationship={relationship}
          onSlide={(index): void =>
            typeof urlParameter === 'string'
              ? setIndex(index.toString())
              : undefined
          }
          {...rest}
        >
          {({
            dialogs,
            slider,
            resource,
            onAdd: handleAdd,
            onRemove: handleRemove,
            isLoading,
          }): JSX.Element => (
            <>
              <ResourceView
                dialog={dialog}
                headerButtons={(specifyNetworkBadge): JSX.Element => (
                  <>
                    <DataEntry.Visit
                      /*
                       * If dialog is not false, the visit button would be added
                       * by ResourceView
                       */
                      resource={
                        !isDependent && dialog === false ? resource : undefined
                      }
                    />
                    {hasTablePermission(
                      relationship.relatedTable.name,
                      isDependent ? 'create' : 'read'
                    ) && typeof handleAdd === 'function' ? (
                      <DataEntry.Add
                        disabled={
                          isReadOnly ||
                          (isToOne && collection.models.length > 0)
                        }
                        onClick={handleAdd}
                      />
                    ) : undefined}
                    {hasTablePermission(
                      relationship.relatedTable.name,
                      isDependent ? 'delete' : 'read'
                    ) && typeof handleRemove === 'function' ? (
                      <DataEntry.Remove
                        disabled={
                          isReadOnly ||
                          collection.models.length === 0 ||
                          resource === undefined
                        }
                        onClick={(): void => handleRemove('minusButton')}
                      />
                    ) : undefined}
                    <span
                      className={`flex-1 ${
                        dialog === false ? '-ml-2' : '-ml-4'
                      }`}
                    />
                    {specifyNetworkBadge}
                    {!isToOne && slider}
                  </>
                )}
                isDependent={isDependent}
                isLoading={isLoading}
                isSubForm={dialog === false}
                resource={resource}
                title={relationship.label}
                onAdd={undefined}
                onDeleted={
                  collection.models.length <= 1 ? handleClose : undefined
                }
                onSaved={handleClose}
                viewName={viewName}
                /*
                 * Don't save the resource on save button click if it is a dependent
                 * resource
                 */
                onClose={handleClose}
              />
              {dialogs}
            </>
          )}
        </RecordSelectorFromCollection>
      )}
    </ReadOnlyContext.Provider>
  );
}
