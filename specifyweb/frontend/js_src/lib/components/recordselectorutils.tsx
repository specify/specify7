import React from 'react';

import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../collection';
import { DependentCollection, LazyCollection } from '../collectionapi';
import type { RecordSet as RecordSetSchema } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import { clamp, removeItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { FormMode, FormType } from '../parseform';
import { hasTablePermission, hasToolPermission } from '../permissions';
import { formatUrl, parseUrl } from '../querystring';
import {
  createResource,
  deleteResource,
  getResourceViewUrl,
  resourceOn,
} from '../resource';
import { getModelById } from '../schema';
import type { Relationship } from '../specifyfield';
import type { Collection } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { Button, DataEntry } from './basic';
import { LoadingContext } from './contexts';
import { crash } from './errorboundary';
import { FormTableCollection } from './formtable';
import { useBooleanState, useTriggerState } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';
import { pushUrl } from './navigation';
import type { RecordSelectorProps } from './recordselector';
import { BaseRecordSelector } from './recordselector';
import { EditRecordSet } from './recordsetsdialog';
import { augmentMode, ResourceView } from './resourceview';

const getDefaultIndex = (queryParameter: string, lastIndex: number): number =>
  f.var(parseUrl()[queryParameter], (index) =>
    index === 'end' ? lastIndex : f.parseInt(index) ?? 0
  );

function setQueryParameter(queryParameter: string, index: number): void {
  const parameters = { [queryParameter]: index.toString() };
  pushUrl(formatUrl(globalThis.location.href, parameters));
}

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
}: {
  readonly collection: Collection<SCHEMA>;
  readonly relationship: Relationship;
  readonly defaultIndex?: number;
} & Partial<Pick<RecordSelectorProps<SCHEMA>, 'onAdd' | 'onDelete'>> &
  Omit<
    RecordSelectorProps<SCHEMA>,
    | 'model'
    | 'relatedResource'
    | 'records'
    | 'isDependent'
    | 'onAdd'
    | 'onDelete'
    | 'index'
    | 'totalCount'
  >): JSX.Element | null {
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
      totalCount={collection._totalCount ?? records.length}
      model={collection.model.specifyModel}
      relatedResource={isDependent ? collection.related : undefined}
      records={records}
      onAdd={(resource): void => {
        if (isDependent && isToOne)
          collection.related?.placeInSameHierarchy(resource);
        collection.add(resource);
        handleAdd?.(resource);
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
      index={index}
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
  'onSlide' | 'children' | 'model'
> & {
  readonly dialog: false | 'modal' | 'nonModal';
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
  return formType === 'formTable' ? (
    <FormTableCollection
      collection={collection}
      mode={mode}
      viewName={viewName}
      dialog={dialog}
      onAdd={undefined}
      onDelete={undefined}
      onClose={handleClose}
      sortField={sortField}
    />
  ) : (
    <RecordSelectorFromCollection
      collection={collection}
      defaultIndex={
        isToOne
          ? 0
          : getDefaultIndex(urlParameter ?? '', collection.models.length)
      }
      onSlide={(index): void =>
        typeof urlParameter === 'string'
          ? setQueryParameter(urlParameter, index)
          : undefined
      }
      relationship={relationship}
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
            isLoading={isLoading}
            resource={resource}
            dialog={dialog}
            title={`${relationship.label}`}
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
                    onClick={handleAdd}
                    disabled={
                      mode === 'view' ||
                      (isToOne && collection.models.length > 0)
                    }
                  />
                ) : undefined}
                {hasTablePermission(
                  relationship.relatedModel.name,
                  isDependent ? 'create' : 'read'
                ) && typeof handleRemove === 'function' ? (
                  <DataEntry.Remove
                    onClick={(): void => handleRemove('minusButton')}
                    disabled={mode === 'view' || collection.models.length === 0}
                  />
                ) : undefined}
                <span
                  className={`flex-1 ${dialog === false ? '-ml-2' : '-ml-4'}`}
                />
                {specifyNetworkBadge}
                {!isToOne && slider}
              </>
            )}
            mode={mode}
            viewName={viewName}
            isSubForm={dialog === false}
            isDependent={isDependent}
            canAddAnother={false}
            /*
             * Don't save the resource on save button click if it is a dependent
             * resource
             */
            onSaving={undefined}
            onSaved={handleClose}
            onDeleted={collection.models.length <= 1 ? handleClose : undefined}
            onClose={handleClose}
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
}: {
  /*
   * Undefined IDs are placeholders for items with unknown IDs (e.g in record
   * sets or query results with thousands of items)
   */
  readonly ids: RA<number | undefined>;
  readonly newResource: SpecifyResource<SCHEMA> | undefined;
  readonly defaultIndex?: number;
  readonly title: string | undefined;
  readonly headerButtons?: JSX.Element;
  readonly dialog: false | 'modal' | 'nonModal';
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
  readonly urlContext: false | undefined | number;
} & Omit<
  RecordSelectorProps<SCHEMA>,
  'records' | 'index' | 'children'
>): JSX.Element | null {
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
  const currentResourceId = currentResource?.id;
  React.useEffect(
    () =>
      urlContext === false
        ? undefined
        : pushUrl(
            getResourceViewUrl(model.name, currentResourceId, urlContext)
          ),
    [urlContext, model, currentResourceId]
  );

  // Show a warning dialog if navigating away before saving the record
  const [unloadProtect, setUnloadProtect] = React.useState<
    (() => void) | undefined
  >(undefined);

  return (
    <BaseRecordSelector<SCHEMA>
      {...rest}
      onAdd={
        typeof handleAdd === 'function'
          ? (resource): void => {
              if (currentResource?.needsSaved === true)
                /*
                 * Since React's setState has a special behavior when a function
                 * argument is passed, need to wrap a function in a function
                 */
                setUnloadProtect(() => () => handleAdd(resource));
              else handleAdd(resource);
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
      totalCount={rest.totalCount + (typeof newResource === 'object' ? 1 : 0)}
      index={index}
      model={model}
      records={
        typeof newResource === 'object' ? [...records, newResource] : records
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
            isLoading={isLoading}
            resource={resource}
            dialog={dialog}
            title={title}
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
                    disabled={mode === 'view'}
                    onClick={handleAdd}
                    title={
                      typeof urlContext === 'number'
                        ? formsText('addToRecordSet')
                        : commonText('add')
                    }
                    aria-label={
                      typeof urlContext === 'number'
                        ? formsText('addToRecordSet')
                        : commonText('add')
                    }
                  />
                ) : undefined}
                {(resource?.isNew() === true ||
                  hasTablePermission(model.name, 'delete')) &&
                typeof handleRemove === 'function' &&
                canRemove ? (
                  <DataEntry.Remove
                    disabled={resource === undefined || mode === 'view'}
                    onClick={(): void => handleRemove('minusButton')}
                    title={
                      typeof urlContext === 'number'
                        ? formsText('removeFromRecordSet')
                        : commonText('delete')
                    }
                    aria-label={
                      typeof urlContext === 'number'
                        ? formsText('removeFromRecordSet')
                        : commonText('delete')
                    }
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
            mode={mode}
            viewName={viewName}
            isSubForm={false}
            canAddAnother={canAddAnother}
            onSaved={(payload): void =>
              handleSaved({
                ...payload,
                resource: defined(resource),
              })
            }
            isDependent={isDependent}
            onDeleted={handleRemove?.bind(undefined, 'deleteButton')}
            onClose={handleClose}
          />
          {dialogs}
          {typeof unloadProtect === 'function' && (
            <Dialog
              header={formsText('recordSelectorUnloadProtectDialogHeader')}
              onClose={(): void => setUnloadProtect(undefined)}
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
  | 'records'
  | 'field'
  | 'defaultIndex'
  | 'totalCount'
  | 'children'
  | 'onDelete'
  | 'onSaved'
  | 'index'
> & {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
  readonly defaultResourceIndex: number | undefined;
  readonly dialog: false | 'modal' | 'nonModal';
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
  const [hasDuplicate, handleHasDuplicate, handleDismissDuplicate] =
    useBooleanState();
  const handleAdd = (resource: SpecifyResource<SCHEMA>): void =>
    setItems(({ totalCount, ids } = defaultRecordSetState) => {
      // If resource is not yet in a context of a record set, make it
      if (resource.recordsetid !== recordSet.id) {
        resource.recordsetid = recordSet.id;
        /*
         * For new resources, RecordSetItem would be created by the
         * back-end on save. For existing resources have to do that
         * manually
         */
        if (!resource.isNew())
          loading(
            createResource('RecordSetItem', {
              recordId: resource.id,
              recordSet: recordSet.get('resource_uri'),
            })
          );
      }
      return {
        totalCount: totalCount + 1,
        ids: resource.isNew() ? ids : [...ids, resource.id],
        newResource: resource.isNew() ? resource : undefined,
        index: totalCount,
      };
    });

  return totalCount === 0 && newResource === undefined ? (
    <LoadingScreen />
  ) : (
    <>
      <RecordSelectorFromIds<SCHEMA>
        {...rest}
        ids={ids}
        title={`${commonText('recordSet')}: ${recordSet.get('name')}`}
        headerButtons={<EditRecordSetButton recordSet={recordSet} />}
        isDependent={false}
        newResource={newResource}
        dialog={dialog}
        mode={mode}
        canAddAnother={canAddAnother}
        onClose={handleClose}
        totalCount={totalCount}
        defaultIndex={index}
        onSaved={({ newResource, wasNew, resource }): void => {
          if (wasNew) {
            handleAdd(resource);
            pushUrl(resource.viewUrl());
          }
          if (typeof newResource === 'object') handleAdd(newResource);
        }}
        onAdd={
          hasToolPermission('recordSets', 'create')
            ? (resource) =>
                loading(
                  // Detect duplicate record set item
                  (resource.isNew()
                    ? Promise.resolve(false)
                    : fetchCollection('RecordSetItem', {
                        recordSet: recordSet.id,
                        recordId: resource.id,
                        limit: 1,
                      }).then(({ totalCount }) => totalCount !== 0)
                  ).then((isDuplicate) =>
                    isDuplicate ? handleHasDuplicate() : handleAdd(resource)
                  )
                )
            : undefined
        }
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
        onSlide={(index): void =>
          setItems({
            totalCount,
            ids,
            newResource: undefined,
            index: Math.min(index, totalCount - 1),
          })
        }
        urlContext={recordSet.id}
      />
      {hasDuplicate && (
        <Dialog
          header={formsText('duplicateRecordSetItemDialogHeader')}
          buttons={commonText('close')}
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
          recordSet={recordSet}
          onClose={handleClose}
          isReadOnly={false}
        />
      )}
    </>
  );
}
