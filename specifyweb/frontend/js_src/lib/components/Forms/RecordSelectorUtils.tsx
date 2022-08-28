import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  DEFAULT_FETCH_LIMIT,
  fetchCollection,
} from '../DataModel/collection';
import {
  DependentCollection,
  LazyCollection,
} from '../DataModel/collectionApi';
import type { RecordSet as RecordSetSchema } from '../DataModel/types';
import type { AnySchema } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import { clamp, removeItem } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { FormMode, FormType } from '../FormParse';
import { hasTablePermission, hasToolPermission } from '../Permissions/helpers';
import {
  createResource,
  deleteResource,
  getResourceViewUrl,
  resourceOn,
} from '../DataModel/resource';
import { getModelById } from '../DataModel/schema';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyModel';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { Button, DataEntry } from '../Atoms/Basic';
import { LoadingContext } from '../Core/Contexts';
import { crash } from '../Errors/ErrorBoundary';
import { FormTableCollection } from '../FormCells/FormTable';
import { useBooleanState, useTriggerState } from '../../hooks/hooks';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { useSearchParam as useSearchParameter } from '../../hooks/navigation';
import type { RecordSelectorProps } from './RecordSelector';
import { BaseRecordSelector } from './RecordSelector';
import { EditRecordSet } from '../QueryBuilder/RecordSets';
import { augmentMode, ResourceView } from './ResourceView';

/** A wrapper for RecordSelector to integrate with Backbone.Collection */
function RecordSelectorFromCollection<SCHEMA extends AnySchema>({
  collection,
  relationship,
  onAdd: handleAdd,
  onDelete: handleDelete,
  onSlide: handleSlide,
  children,
  defaultIndex,
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
  | 'totalCount'
> &
  Partial<Pick<RecordSelectorProps<SCHEMA>, 'onAdd' | 'onDelete'>> & {
    readonly collection: Collection<SCHEMA>;
    readonly relationship: Relationship;
    readonly defaultIndex?: number;
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

  const [index, setIndex] = useTriggerState(
    Math.max(0, defaultIndex ?? collection._totalCount ?? 0)
  );

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
        .catch(crash);
  }, [collection, isLazy, getRecords, index, records.length]);

  return (
    <BaseRecordSelector<SCHEMA>
      {...rest}
      index={index}
      model={collection.model.specifyModel}
      records={records}
      relatedResource={isDependent ? collection.related : undefined}
      totalCount={collection._totalCount ?? records.length}
      onAdd={(rawResources): void => {
        const resources = isToOne ? rawResources.slice(0, 1) : rawResources;
        if (isDependent && isToOne)
          collection.related?.placeInSameHierarchy(resources[0]);
        collection.add(resources);
        handleAdd?.(resources);
        setIndex(collection.models.length - 1);
        handleSlide?.(collection.models.length - 1);
        // Updates the state to trigger a reRender
        setRecords(getRecords);
      }}
      onDelete={(_index, source): void => {
        collection.remove(defined(records[index]));
        handleDelete?.(index, source);
        setRecords(getRecords);
      }}
      onSlide={(index, callback): void => {
        setIndex(index);
        handleSlide?.(index);
        callback?.();
      }}
    >
      {children}
    </BaseRecordSelector>
  );
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
  ...rest
}: Omit<
  Parameters<typeof RecordSelectorFromCollection>[0],
  'children' | 'model' | 'onSlide'
> & {
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly mode: FormMode;
  readonly formType: FormType;
  readonly viewName?: string;
  readonly urlParameter?: string;
  readonly onClose: () => void;
  readonly sortField: string | undefined;
}): JSX.Element {
  const isDependent = collection instanceof DependentCollection;
  const isToOne =
    !relationshipIsToMany(relationship) || relationship.type === 'zero-to-one';
  const mode = augmentMode(initialMode, false, relationship.relatedModel.name);

  const [rawIndex, setIndex] = useSearchParameter(urlParameter);
  const index = f.parseInt(rawIndex) ?? collection.models.length - 1;
  return formType === 'formTable' ? (
    <FormTableCollection
      collection={collection}
      dialog={dialog}
      mode={mode}
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
            canAddAnother={false}
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
                  isDependent ? 'create' : 'read'
                ) && typeof handleRemove === 'function' ? (
                  <DataEntry.Remove
                    disabled={mode === 'view' || collection.models.length === 0}
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
            title={`${relationship.label}`}
            viewName={viewName}
            /*
             * Don't save the resource on save button click if it is a dependent
             * resource
             */
            onClose={handleClose}
            onDeleted={collection.models.length <= 1 ? handleClose : undefined}
            onSaved={handleClose}
          />
          {dialogs}
        </>
      )}
    </RecordSelectorFromCollection>
  );
}

/**
 * A Wrapper for RecordSelector that allows to specify list of records by their
 * IDs
 */
export function RecordSelectorFromIds<SCHEMA extends AnySchema>({
  ids,
  newResource,
  onSlide: handleSlide,
  defaultIndex,
  model,
  viewName,
  title = model.label,
  headerButtons,
  dialog,
  isDependent,
  mode,
  canAddAnother,
  canRemove = true,
  onClose: handleClose,
  onSaved: handleSaved,
  onAdd: handleAdd,
  onDelete: handleDelete,
  urlContext,
  ...rest
}: Omit<RecordSelectorProps<SCHEMA>, 'children' | 'index' | 'records'> & {
  /*
   * Undefined IDs are placeholders for items with unknown IDs (e.g in record
   * sets or query results with thousands of items)
   */
  readonly ids: RA<number | undefined>;
  readonly newResource: SpecifyResource<SCHEMA> | undefined;
  readonly defaultIndex?: number;
  readonly title: string | undefined;
  readonly headerButtons?: JSX.Element;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly isDependent: boolean;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly canAddAnother: boolean;
  readonly canRemove?: boolean;
  readonly onClose: () => void;
  readonly onSaved: (payload: {
    readonly resource: SpecifyResource<SCHEMA>;
    readonly newResource: SpecifyResource<SCHEMA> | undefined;
    readonly wasNew: boolean;
  }) => void;
  // Record set ID, or false to not update the URL
  readonly urlContext: number | false | undefined;
}): JSX.Element | null {
  const [records, setRecords] = React.useState<
    RA<SpecifyResource<SCHEMA> | undefined>
  >(() =>
    ids.map((id) => (id === undefined ? undefined : new model.Resource({ id })))
  );

  const previousIds = React.useRef(ids);
  React.useEffect(() => {
    setRecords((records) =>
      ids.map((id, index) => {
        if (id === undefined) return undefined;
        else if (records[index]?.id === id) return records[index];
        else {
          const resource = new model.Resource({ id });
          // @ts-expect-error Setting a read-only value
          if (typeof urlContext === 'number') resource.recordsetid = urlContext;
          return resource;
        }
      })
    );

    return (): void => {
      previousIds.current = ids;
    };
  }, [ids, model]);

  const [index, setIndex] = React.useState(defaultIndex ?? ids.length - 1);
  React.useEffect(
    () =>
      typeof defaultIndex === 'number' ? setIndex(defaultIndex) : undefined,
    [defaultIndex]
  );
  React.useEffect(
    () =>
      setIndex((index) =>
        typeof newResource === 'object'
          ? rest.totalCount
          : Math.min(index, rest.totalCount - 1)
      ),
    [newResource, rest.totalCount]
  );

  const currentResource = newResource ?? records[index];

  // Show a warning dialog if navigating away before saving the record
  const [unloadProtect, setUnloadProtect] = React.useState<
    (() => void) | undefined
  >(undefined);

  return (
    <BaseRecordSelector<SCHEMA>
      {...rest}
      index={index}
      model={model}
      records={
        typeof newResource === 'object' ? [...records, newResource] : records
      }
      totalCount={rest.totalCount + (typeof newResource === 'object' ? 1 : 0)}
      onAdd={
        typeof handleAdd === 'function'
          ? (resources): void => {
              if (currentResource?.needsSaved === true)
                /*
                 * Since React's setState has a special behavior when a function
                 * argument is passed, need to wrap a function in a function
                 */
                setUnloadProtect(() => () => handleAdd(resources));
              else handleAdd(resources);
            }
          : undefined
      }
      onDelete={
        typeof handleDelete === 'function'
          ? (index, source): void => {
              handleDelete(index, source);
              setRecords(removeItem(records, index));
              if (ids.length === 1) handleClose();
            }
          : undefined
      }
      onSlide={(index, callback): void => {
        function doSlide(): void {
          setIndex(index);
          handleSlide?.(index);
          callback?.();
        }

        if (
          currentResource?.needsSaved === true ||
          /*
           * If adding new resource that hasn't yet been modified, show a
           * warning anyway because navigating away before saving in a
           * RecordSet cancels the record adding process
           */
          currentResource?.isNew() === true
        )
          setUnloadProtect(() => doSlide);
        else doSlide();
      }}
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
            canAddAnother={canAddAnother}
            dialog={dialog}
            headerButtons={(specifyNetworkBadge): JSX.Element => (
              <>
                {headerButtons}
                <DataEntry.Visit
                  resource={
                    !isDependent && dialog !== false ? resource : undefined
                  }
                />
                {hasTablePermission(
                  model.name,
                  isDependent ? 'create' : 'read'
                ) && typeof handleAdd === 'function' ? (
                  <DataEntry.Add
                    aria-label={
                      typeof urlContext === 'number'
                        ? formsText('addToRecordSet')
                        : commonText('add')
                    }
                    disabled={mode === 'view'}
                    title={
                      typeof urlContext === 'number'
                        ? formsText('addToRecordSet')
                        : commonText('add')
                    }
                    onClick={handleAdd}
                  />
                ) : undefined}
                {typeof handleRemove === 'function' && canRemove ? (
                  <DataEntry.Remove
                    aria-label={
                      typeof urlContext === 'number'
                        ? formsText('removeFromRecordSet')
                        : commonText('delete')
                    }
                    disabled={resource === undefined || mode === 'view'}
                    title={
                      typeof urlContext === 'number'
                        ? formsText('removeFromRecordSet')
                        : commonText('delete')
                    }
                    onClick={(): void => handleRemove('minusButton')}
                  />
                ) : undefined}
                {typeof newResource === 'object' ? (
                  <p className="flex-1">{formsText('creatingNewRecord')}</p>
                ) : (
                  <span
                    className={`flex-1 ${dialog === false ? '-ml-2' : '-ml-4'}`}
                  />
                )}
                {specifyNetworkBadge}
                {slider}
              </>
            )}
            isDependent={isDependent}
            isLoading={isLoading}
            isSubForm={false}
            mode={mode}
            resource={resource}
            title={title}
            viewName={viewName}
            onClose={handleClose}
            onDeleted={
              resource?.isNew() === true ||
              hasTablePermission(model.name, 'delete')
                ? handleRemove?.bind(undefined, 'deleteButton')
                : undefined
            }
            onSaved={(payload): void =>
              handleSaved({
                ...payload,
                resource: defined(resource),
              })
            }
          />
          {dialogs}
          {typeof unloadProtect === 'function' && (
            <Dialog
              buttons={
                <>
                  <Button.DialogClose>
                    {commonText('cancel')}
                  </Button.DialogClose>
                  <Button.Orange
                    onClick={(): void => {
                      unloadProtect();
                      setUnloadProtect(undefined);
                    }}
                  >
                    {commonText('proceed')}
                  </Button.Orange>
                </>
              }
              header={formsText('recordSelectorUnloadProtectDialogHeader')}
              onClose={(): void => setUnloadProtect(undefined)}
            >
              {formsText('recordSelectorUnloadProtectDialogText')}
            </Dialog>
          )}
        </>
      )}
    </BaseRecordSelector>
  );
}

/** Fetch IDs of records in a record set at a given position */
const fetchItems = async (
  recordSetId: number,
  offset: number
): Promise<
  (ids: RA<number | undefined>) => {
    readonly ids: RA<number | undefined>;
    readonly totalCount: number;
  }
> =>
  fetchCollection('RecordSetItem', {
    limit: DEFAULT_FETCH_LIMIT,
    recordSet: recordSetId,
    orderBy: 'id',
    offset,
  }).then(({ records, totalCount }) => (ids: RA<number | undefined>) => ({
    totalCount,
    ids: records
      .map(({ recordId }, index) => [offset + index, recordId] as const)
      .reduce(
        (items, [order, recordId]) => {
          items[order] = recordId;
          return items;
        },

        ids.length === 0
          ? /*
             * Creating a sparse array of correct length here. Can't use
             * Array.from({ length: totalCount }) because it creates a dense array
             */
            /* eslint-disable-next-line unicorn/no-new-array */
            new Array(totalCount)
          : /*
             * A trivial slice to create a shallow copy. Can't use Array.from
             * because that decompresses a sparse array
             */
            ids.slice()
      ),
  }));

export function RecordSet<SCHEMA extends AnySchema>({
  recordSet,
  defaultResourceIndex,
  dialog,
  mode,
  onClose: handleClose,
  canAddAnother,
  ...rest
}: Omit<
  RecordSelectorProps<SCHEMA>,
  | 'children'
  | 'defaultIndex'
  | 'field'
  | 'index'
  | 'onDelete'
  | 'onSaved'
  | 'records'
  | 'totalCount'
> & {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
  readonly defaultResourceIndex: number | undefined;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly mode: FormMode;
  readonly onClose: () => void;
  readonly canAddAnother: boolean;
}): JSX.Element {
  const [items, setItems] = React.useState<
    | {
        readonly totalCount: number;
        /*
         * Caution, this array can be sparse
         * IDs is a sparse array because some record sets may have tens of
         * thousands of items), Also, an array with 40k elements in a React
         * State causes React DevTools to crash
         */
        readonly ids: RA<number | undefined>;
        readonly newResource: SpecifyResource<SCHEMA> | undefined;
        readonly index: number;
      }
    | undefined
  >(undefined);
  const defaultRecordSetState = {
    totalCount: 0,
    ids: [],
    newResource: undefined,
    index: defaultResourceIndex ?? 0,
  };
  const { totalCount, ids, newResource, index } =
    items ?? defaultRecordSetState;

  // Fetch ID of record at current index
  const currentRecordId = ids[index];
  const previousIndex = React.useRef<number>(index);
  React.useEffect(() => {
    if (currentRecordId === undefined)
      fetchItems(
        recordSet.id,
        // If new index is smaller (i.e, going back), fetch previous 20 IDs
        clamp(
          0,
          previousIndex.current > index
            ? index - DEFAULT_FETCH_LIMIT + 1
            : index,
          totalCount
        )
      )
        .then((updateIds) =>
          setItems(({ ids, newResource, index } = defaultRecordSetState) =>
            f.var(updateIds(ids), ({ totalCount, ids }) => ({
              ids,
              totalCount,
              newResource:
                newResource ??
                (totalCount === 0
                  ? f.var(
                      getModelById(recordSet.get('dbTableId')),
                      (model) => new model.Resource()
                    )
                  : undefined),
              index,
            }))
          )
        )
        .catch(crash);
    return (): void => {
      previousIndex.current = index;
    };
  }, [totalCount, currentRecordId, index, recordSet.id]);

  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    | {
        readonly originalLocation?: Location;
        readonly itemIndex?: number;
      }
    | undefined;
  const originalLocation = state?.originalLocation;
  const itemIndex = state?.itemIndex;
  React.useEffect(
    () =>
      setItems((state) =>
        state?.index === itemIndex || itemIndex === undefined
          ? state
          : {
              ...defaultRecordSetState,
              ...state,
              index: itemIndex,
            }
      ),
    [itemIndex]
  );
  /** Change the URL without changing the rendered component */
  const softNavigate = (url: string, itemIndex: number | undefined): void =>
    navigate(url, {
      state: {
        type: 'NoopRoute',
        originalLocation: originalLocation ?? location,
        itemIndex,
      },
    });

  const [hasDuplicate, handleHasDuplicate, handleDismissDuplicate] =
    useBooleanState();
  const handleAdd = (resources: RA<SpecifyResource<SCHEMA>>): void =>
    setItems(({ totalCount, ids } = defaultRecordSetState) => {
      loading(
        Promise.all(
          resources.map((resource) => {
            // If resource is not yet in a context of a record set, make it
            if (resource.recordsetid !== recordSet.id) {
              // @ts-expect-error Setting a read-only value
              resource.recordsetid = recordSet.id;
              /*
               * For new resources, RecordSetItem would be created by the
               * back-end on save. For existing resources have to do that
               * manually
               */
              return resource.isNew()
                ? undefined
                : createResource('RecordSetItem', {
                    recordId: resource.id,
                    recordSet: recordSet.get('resource_uri'),
                  });
            } else return undefined;
          })
        )
      );
      const hasNew = resources.some((resource) => resource.isNew());
      if (hasNew && resources.length > 1)
        throw new Error("Can't add multiple new resources at once");
      softNavigate(resources[0].viewUrl(), hasNew ? undefined : ids.length);
      return {
        totalCount: totalCount + 1,
        ids: hasNew ? ids : [...ids, ...resources.map(({ id }) => id)],
        newResource: hasNew ? resources[0] : undefined,
        index: totalCount,
      };
    });

  return totalCount === 0 && newResource === undefined ? (
    <LoadingScreen />
  ) : (
    <>
      <RecordSelectorFromIds<SCHEMA>
        {...rest}
        canAddAnother={canAddAnother}
        defaultIndex={index}
        dialog={dialog}
        headerButtons={<EditRecordSetButton recordSet={recordSet} />}
        ids={ids}
        isDependent={false}
        mode={mode}
        newResource={newResource}
        title={`${commonText('recordSet')}: ${recordSet.get('name')}`}
        totalCount={totalCount}
        urlContext={recordSet.id}
        onAdd={
          hasToolPermission('recordSets', 'create')
            ? async (resources) =>
                // Detect duplicate record set item
                Promise.all(
                  resources.map(async (resource) =>
                    f.all({
                      resource,
                      isDuplicate: resource.isNew()
                        ? Promise.resolve(false)
                        : fetchCollection('RecordSetItem', {
                            recordSet: recordSet.id,
                            recordId: resource.id,
                            limit: 1,
                          }).then(({ totalCount }) => totalCount !== 0),
                    })
                  )
                ).then((results) => {
                  const hasDuplicate = results.some(
                    ({ isDuplicate }) => isDuplicate
                  );
                  if (hasDuplicate && results.length === 1)
                    handleHasDuplicate();
                  else {
                    const resources = results
                      .filter(({ isDuplicate }) => !isDuplicate)
                      .map(({ resource }) => resource);
                    handleAdd(resources);
                  }
                })
            : undefined
        }
        onClose={handleClose}
        onDelete={
          (recordSet.isNew() || hasToolPermission('recordSets', 'delete')) &&
          (newResource === undefined || totalCount !== 0)
            ? (_index, source): void => {
                if (typeof newResource === 'object')
                  setItems({ totalCount, ids, newResource: undefined, index });
                else
                  loading(
                    (source === 'minusButton'
                      ? fetchCollection('RecordSetItem', {
                          limit: 1,
                          recordId: ids[index],
                          recordSet: recordSet.id,
                        }).then(async ({ records }) =>
                          deleteResource(
                            'RecordSetItem',
                            defined(records[0]).id
                          )
                        )
                      : Promise.resolve()
                    ).then(() => {
                      setItems({
                        totalCount: totalCount - 1,
                        ids: removeItem(ids, index),
                        newResource: undefined,
                        index: clamp(
                          0,
                          /*
                           * Previous index decides which direction to go in
                           * once item is deleted
                           */
                          previousIndex.current > index
                            ? Math.max(0, index - 1)
                            : index,
                          totalCount - 2
                        ),
                      });
                      if (totalCount === 1) handleClose();
                    })
                  );
              }
            : undefined
        }
        onSaved={({ newResource, wasNew, resource }): void => {
          if (wasNew) {
            handleAdd([resource]);
          }
          if (typeof newResource === 'object') handleAdd([newResource]);
        }}
        onSlide={(index): void => {
          softNavigate(
            getResourceViewUrl(rest.model.name, ids[index], recordSet.id),
            index
          );
          setItems({
            totalCount,
            ids,
            newResource: undefined,
            index: Math.min(index, totalCount - 1),
          });
        }}
      />
      {hasDuplicate && (
        <Dialog
          buttons={commonText('close')}
          header={formsText('duplicateRecordSetItemDialogHeader')}
          onClose={handleDismissDuplicate}
        >
          {formsText('duplicateRecordSetItemDialogText')}
        </Dialog>
      )}
    </>
  );
}

function EditRecordSetButton({
  recordSet,
}: {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <EditRecordSet
          isReadOnly={false}
          recordSet={recordSet}
          onClose={handleClose}
        />
      )}
    </>
  );
}
