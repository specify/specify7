import React from 'react';

import { useSearchParameter } from '../../hooks/navigation';
import { useTriggerState } from '../../hooks/useTriggerState';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { DataEntry } from '../Atoms/DataEntry';
import { fetchCollection } from '../DataModel/collection';
import {
  DependentCollection,
  LazyCollection,
} from '../DataModel/collectionApi';
import { getField } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection, SpecifyModel } from '../DataModel/specifyModel';
import type {
  Disposal,
  DisposalPreparation,
  Gift,
  GiftPreparation,
  Loan,
  LoanPreparation,
  RecordSet,
} from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { FormTableCollection } from '../FormCells/FormTableCollection';
import type { FormMode, FormType } from '../FormParse';
import type { SubViewSortField } from '../FormParse/cells';
import { augmentMode, ResourceView } from '../Forms/ResourceView';
import { userInformation } from '../InitialContext/userInformation';
import { InteractionDialog } from '../Interactions/InteractionDialog';
import { toSmallSortConfig } from '../Molecules/Sorting';
import { hasTablePermission } from '../Permissions/helpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import type {
  RecordSelectorProps,
  RecordSelectorState,
} from './RecordSelector';
import { useRecordSelector } from './RecordSelector';
const defaultOrder: SubViewSortField = {
  fieldNames: ['timestampCreated'],
  direction: 'desc',
};
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
  setRecordSetsPromise,
  ...rest
}: Omit<
  RecordSelectorProps<SCHEMA>,
  | 'index'
  | 'isDependent'
  | 'model'
  | 'onAdd'
  | 'onDelete'
  | 'records'
  | 'relatedResource'
> &
  Partial<Pick<RecordSelectorProps<SCHEMA>, 'onAdd' | 'onDelete'>> & {
    readonly collection: Collection<SCHEMA>;
    readonly relationship: Relationship;
    readonly defaultIndex?: number;
    readonly children: (state: RecordSelectorState<SCHEMA>) => JSX.Element;
    readonly setRecordSetsPromise: React.Dispatch<
      React.SetStateAction<
        | Promise<{
            readonly records: RA<SerializedResource<RecordSet>>;
            readonly totalCount: number;
          }>
        | undefined
      >
    >;
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
    model: collection.model.specifyModel,
    records,
    relatedResource: isDependent ? collection.related : undefined,
    totalCount: collection._totalCount ?? records.length,
    onAdd: (rawResources): void => {
      const resources = isToOne ? rawResources.slice(0, 1) : rawResources;
      if (isDependent && isToOne)
        collection.related?.placeInSameHierarchy(resources[0]);
      handleAdd?.(resources);
      handleSlide?.(collection.models.length - 1, false);
      // Updates the state to trigger a reRender
      setRecords(getRecords);
      setRecordSetsPromise(
        fetchCollection('RecordSet', {
          specifyUser: userInformation.id,
          type: 0,
          dbTableId: schema.models.CollectionObject.tableId,
          domainFilter: true,
          orderBy: toSmallSortConfig(defaultOrder) as 'name',
          limit: 5000,
        })
      );
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
  mode: initialMode,
  viewName,
  collection,
  dialog,
  onClose: handleClose,
  formType,
  sortField,
  relationship,
  onAdd: handleAdd,
  onDelete: handleDelete,
  isInteraction,
  ...rest
}: Omit<
  Parameters<typeof RecordSelectorFromCollection>[0],
  'children' | 'model' | 'onSlide' | 'setRecordSetsPromise'
> & {
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly mode: FormMode;
  readonly formType: FormType;
  readonly viewName?: string;
  readonly urlParameter?: string;
  readonly onClose: () => void;
  readonly sortField: SubViewSortField | undefined;
  readonly isInteraction?: boolean;
}): JSX.Element {
  const isDependent = collection instanceof DependentCollection;
  const isToOne =
    !relationshipIsToMany(relationship) || relationship.type === 'zero-to-one';
  const mode = augmentMode(initialMode, false, relationship.relatedModel.name);

  const [recordSetsPromise, setRecordSetsPromise] = React.useState<
    | Promise<{
        readonly records: RA<SerializedResource<RecordSet>>;
        readonly totalCount: number;
      }>
    | undefined
  >(undefined);

  const [rawIndex, setIndex] = useSearchParameter(urlParameter);
  const index = f.parseInt(rawIndex) ?? 0;
  return (
    <RecordSelectorFromCollection
      collection={collection}
      defaultIndex={isToOne ? 0 : index}
      relationship={relationship}
      setRecordSetsPromise={setRecordSetsPromise}
      onAdd={handleAdd}
      onDelete={handleDelete}
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
          {typeof recordSetsPromise === 'object' && isInteraction ? (
            <InteractionDialog
              action={{
                model: collection.related?.specifyModel as SpecifyModel<
                  Disposal | Gift | Loan
                >,
              }}
              itemCollection={
                collection as Collection<
                  DisposalPreparation | GiftPreparation | LoanPreparation
                >
              }
              model={schema.models.CollectionObject}
              recordSetsPromise={recordSetsPromise}
              searchField={getField(
                schema.models.CollectionObject,
                'catalogNumber'
              )}
              onClose={(): void => setRecordSetsPromise(undefined)}
            />
          ) : null}
          {formType === 'form' ? (
            <ResourceView
              dialog={dialog}
              headerButtons={(specifyNetworkBadge): JSX.Element => (
                <>
                  <DataEntry.Visit
                    resource={
                      !isDependent && dialog === false ? resource : undefined
                    }
                  />
                  {hasTablePermission(
                    relationship.relatedModel.name,
                    isDependent ? 'create' : 'read'
                  ) && typeof handleAdd === 'function' ? (
                    <DataEntry.Add
                      disabled={
                        mode === 'view' ||
                        (isToOne && collection.models.length > 0)
                      }
                      onClick={handleAdd}
                    />
                  ) : undefined}
                  {hasTablePermission(
                    relationship.relatedModel.name,
                    isDependent ? 'delete' : 'read'
                  ) && typeof handleRemove === 'function' ? (
                    <DataEntry.Remove
                      disabled={
                        mode === 'view' ||
                        collection.models.length === 0 ||
                        resource === undefined
                      }
                      onClick={(): void => handleRemove('minusButton')}
                    />
                  ) : undefined}
                  <span
                    className={`flex-1 ${dialog === false ? '-ml-2' : '-ml-4'}`}
                  />
                  {specifyNetworkBadge}
                  {!isToOne && slider}
                </>
              )}
              isDependent={isDependent}
              isLoading={isLoading}
              isSubForm={dialog === false}
              mode={mode}
              resource={resource}
              title={relationship.label}
              onAdd={undefined}
              onDeleted={
                collection.models.length <= 1 ? handleClose : undefined
              }
              onSaved={handleClose}
              viewName={viewName}
              onClose={handleClose}
            />
          ) : null}
          {formType === 'formTable' ? (
            <FormTableCollection
              collection={collection}
              dialog={dialog}
              mode={mode}
              sortField={sortField}
              viewName={viewName}
              onAdd={(): void => {
                if (typeof handleAdd === 'function') handleAdd();
              }}
              onClose={handleClose}
              onDelete={
                handleDelete === undefined
                  ? undefined
                  : (_resource, index): void =>
                      handleDelete(index, 'minusButton')
              }
            />
          ) : null}
          {dialogs}
        </>
      )}
    </RecordSelectorFromCollection>
  );
}
