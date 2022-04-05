import React from 'react';

import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../collection';
import collectionapi from '../collectionapi';
import type { RecordSet as RecordSetSchema } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import { clamp, removeItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import * as navigation from '../navigation';
import type { FormMode, FormType } from '../parseform';
import { hasTablePermission, hasToolPermission } from '../permissions';
import * as queryString from '../querystring';
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
import type { RecordSelectorProps } from './recordselector';
import { BaseRecordSelector } from './recordselector';
import { augmentMode, ResourceView } from './resourceview';
import { schema } from '../schema';
import { getResourceApiUrl } from '../resource';
import { ping } from '../ajax';

const getDefaultIndex = (queryParameter: string, lastIndex: number): number =>
  f.var(queryString.parse()[queryParameter], (index) =>
    index === 'end' ? lastIndex : f.parseInt(index) ?? 0
  );

function setQueryParameter(queryParameter: string, index: number): void {
  const parameters = { [queryParameter]: index.toString() };
  navigation.push(queryString.format(window.location.href, parameters));
}

/** A wrapper for RecordSelector to integrate with Backbone.Collection */
function RecordSelectorFromCollection<SCHEMA extends AnySchema>({
  collection,
  onAdd: handleAdd,
  onDelete: handleDelete,
  onSlide: handleSlide,
  children,
  defaultIndex,
  ...rest
}: {
  readonly collection: Collection<SCHEMA>;
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
  const [isLoaded, handleLoaded] = useBooleanState();

  const getRecords = React.useCallback(
    (): RA<SpecifyResource<SCHEMA> | undefined> =>
      Array.from(collection.models),
    [collection]
  );
  const [records, setRecords] =
    React.useState<RA<SpecifyResource<SCHEMA> | undefined>>(getRecords);

  const isDependent = collection instanceof collectionapi.Dependent;
  const isLazy = collection instanceof collectionapi.Lazy;
  const field = defined(collection.field?.getReverse());
  const isToOne = !relationshipIsToMany(field);

  // Fetch records if needed
  React.useEffect(() => {
    if (isLazy)
      collection
        .fetchPromise()
        .then(handleLoaded)
        .then(() => setRecords(getRecords))
        .catch(crash);
    else handleLoaded();
  }, [collection, isLazy, getRecords, handleLoaded]);

  // Listen for changes to collection
  React.useEffect(() => {
    const updateRecords = (): void => setRecords(getRecords);
    collection.on('add remove destroy', updateRecords);
    return (): void => collection.off('add remove destroy', updateRecords);
  }, [collection, getRecords]);

  const [index, setIndex] = useTriggerState(
    defaultIndex ?? collection._totalCount ?? 0
  );

  return isLoaded ? (
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
        // Updates the state to trigger a reRender
        setRecords(getRecords);
      }}
      onDelete={(): void => {
        collection.remove(defined(records[index]));
        handleDelete?.(index);
        setRecords(getRecords);
      }}
      index={index}
      onSlide={(index: number): void => {
        setIndex(index);
        if (
          isLazy &&
          index === collection.models.length - 1 &&
          !collection.isComplete()
        )
          collection.fetchPromise().catch(crash);
        handleSlide?.(index);
      }}
    >
      {children}
    </BaseRecordSelector>
  ) : null;
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
  const isDependent = collection instanceof collectionapi.Dependent;
  const field = defined(collection.field?.getReverse());
  const isToOne = !relationshipIsToMany(field);
  const mode = augmentMode(initialMode, false, field.relatedModel.name);
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
      {...rest}
    >
      {({
        dialogs,
        slider,
        resource,
        onAdd: handleAdd,
        onRemove: handleRemove,
      }): JSX.Element => (
        <>
          <ResourceView
            resource={resource}
            dialog={dialog}
            title={`${field?.label ?? collection.model.specifyModel?.label}${
              isToOne ? '' : ` (${collection.models.length})`
            }`}
            headerButtons={
              <>
                <DataEntry.Visit
                  /*
                   * If dialog is not false, the visit button would be added
                   * by ResourceView
                   */
                  resource={
                    isDependent || dialog === false ? undefined : resource
                  }
                />
                {hasTablePermission(
                  field.relatedModel.name,
                  isDependent ? 'create' : 'read'
                ) && (
                  <DataEntry.Add
                    onClick={handleAdd}
                    disabled={
                      mode === 'view' ||
                      (isToOne && collection.models.length > 0)
                    }
                  />
                )}
                {hasTablePermission(
                  field.relatedModel.name,
                  isDependent ? 'create' : 'read'
                ) && (
                  <DataEntry.Delete
                    onClick={handleRemove}
                    disabled={
                      mode === 'view' ||
                      (isToOne && collection.models.length > 0)
                    }
                  />
                )}
                <span className="flex-1 -ml-4" />
                {!isToOne && slider}
              </>
            }
            mode={mode}
            viewName={viewName}
            isSubForm={dialog === false}
            canAddAnother={false}
            onSaving={
              isDependent
                ? (): false => {
                    handleClose();
                    return false;
                  }
                : undefined
            }
            onSaved={undefined}
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
  isAddingNew,
  onSlide: handleSlide,
  defaultIndex,
  model,
  viewName,
  title = model.label,
  dialog,
  isDependent,
  mode,
  onClose: handleClose,
  canAddAnother,
  onSaved: handleSaved,
  ...rest
}: {
  /*
   * Undefined IDs are placeholders for items with unknown IDs (e.g in record
   * sets or query results with thousands of items)
   */
  readonly ids: RA<number | undefined>;
  readonly isAddingNew: boolean;
  readonly defaultIndex?: number;
  readonly title: string | undefined;
  readonly dialog: false | 'modal' | 'nonModal';
  readonly isDependent: boolean;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly onClose: () => void;
  readonly canAddAnother: boolean;
  readonly onSaved: (payload: {
    readonly resource: SpecifyResource<SCHEMA>;
    readonly newResource: SpecifyResource<SCHEMA> | undefined;
    readonly wasNew: boolean;
  }) => void;
} & Omit<
  RecordSelectorProps<SCHEMA>,
  'relatedResource' | 'records' | 'index' | 'children'
>): JSX.Element | null {
  const [records, setRecords] = React.useState<
    RA<SpecifyResource<SCHEMA> | undefined>
  >(() =>
    ids.map((id) =>
      typeof id === 'undefined'
        ? undefined
        : new model.Resource({
            id: typeof id === 'number' ? id : undefined,
          })
    )
  );

  const previousIds = React.useRef(ids);
  React.useEffect(() => {
    setRecords((records) =>
      ids.map((id, index) =>
        typeof id === 'undefined'
          ? undefined
          : records[index] ??
            new model.Resource({ id: typeof id === 'number' ? id : undefined })
      )
    );

    return (): void => {
      previousIds.current = ids;
    };
  }, [ids, model]);

  const newResource = React.useMemo(
    () => (isAddingNew ? new model.Resource({ id: undefined }) : undefined),
    [isAddingNew, model]
  );

  const [index, setIndex] = React.useState(defaultIndex ?? ids.length - 1);

  return (
    <BaseRecordSelector<SCHEMA>
      {...rest}
      model={model}
      records={
        typeof newResource === 'object' ? [...records, newResource] : records
      }
      index={index}
      onSlide={(index: number): void => {
        setIndex(index);
        handleSlide?.(index);
      }}
    >
      {({
        dialogs,
        slider,
        resource,
        onAdd: handleAdd,
        onRemove: handleRemove,
      }): JSX.Element => (
        <>
          <ResourceView
            resource={resource}
            dialog={dialog}
            title={`${title} (${ids.length})`}
            headerButtons={
              <>
                <DataEntry.Visit
                  resource={isDependent ? undefined : resource}
                />
                {hasTablePermission(
                  model.name,
                  isDependent ? 'create' : 'read'
                ) && (
                  <DataEntry.Add
                    disabled={mode === 'view'}
                    onClick={handleAdd}
                  />
                )}
                {resource?.isNew() === true ||
                hasTablePermission(model.name, 'delete') ? (
                  <DataEntry.Delete
                    disabled={
                      typeof resource === 'undefined' || mode === 'view'
                    }
                    onClick={handleRemove}
                  />
                ) : undefined}
                <span className="flex-1 -ml-4" />
                {slider}
              </>
            }
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
            onDeleted={ids.length > 1 ? undefined : handleClose}
            onClose={handleClose}
          />
          {dialogs}
        </>
      )}
    </BaseRecordSelector>
  );
}

const fetchItems = (
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
    offset,
  }).then(({ records, totalCount }) => (ids: RA<number | undefined>) => ({
    totalCount,
    ids: records
      .map(({ recordId }, index) => [offset + index, recordId] as const)
      .reduce((items, [order, recordId]) => {
        items[order] = recordId;
        return items;
      }, Array.from(ids ?? [])),
  }));

// FIXME: test this
export function RecordSet<SCHEMA extends AnySchema>({
  recordSet,
  defaultResourceIndex,
  title,
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
  readonly title: string | undefined;
  readonly dialog: false | 'modal' | 'nonModal';
  readonly mode: FormMode;
  readonly onClose: () => void;
  readonly canAddAnother: boolean;
}): JSX.Element {
  const [items, setItems] = React.useState<
    | {
        readonly totalCount: number;
        readonly ids: RA<number | undefined>;
        readonly isAddingNew: boolean;
      }
    | undefined
  >(undefined);
  const { totalCount, ids, isAddingNew } = items ?? {
    totalCount: 0,
    ids: [],
    isAddingNew: false,
  };

  const [index, setIndex] = React.useState(defaultResourceIndex ?? 0);

  // Fetch ID of record at current index
  const currentRecordId = ids[index];
  const previousIndex = React.useRef<number>(index);
  React.useEffect(() => {
    if (typeof currentRecordId === 'undefined')
      fetchItems(
        recordSet.id,
        // If new index is smaller (i.e, going back), fetch previous 20 elements
        clamp(
          0,
          totalCount,
          previousIndex.current > index ? index - DEFAULT_FETCH_LIMIT : index
        )
      )
        .then((updateIds) =>
          setItems(
            (
              { ids, isAddingNew } = {
                ids: [],
                isAddingNew: false,
                totalCount: 0,
              }
            ) => ({
              ...updateIds(ids),
              isAddingNew,
            })
          )
        )
        .catch(crash);
    return (): void => {
      previousIndex.current = index;
    };
  }, [totalCount, currentRecordId, index, recordSet.id]);

  const handleAdd = (resource: SpecifyResource<SCHEMA>): void =>
    setItems(() => {
      setIndex(totalCount + 1);

      if (resource.recordsetid !== recordSet.id) {
        resource.recordsetid = recordSet.id;
        if (!resource.isNew()) {
          const recordSetItem = new schema.models.RecordSetItem.Resource({
            recordId: resource.id,
            recordSet: getResourceApiUrl('RecordSet', recordSet.id),
          });
          loading(recordSetItem.save());
        }
      }
      return {
        totalCount: totalCount + 1,
        ids: typeof resource.id === 'undefined' ? ids : [...ids, resource.id],
        isAddingNew: typeof resource.id === 'undefined',
      };
    });

  const loading = React.useContext(LoadingContext);
  return totalCount === 0 && !isAddingNew ? (
    typeof items === 'undefined' ? (
      <LoadingScreen />
    ) : (
      <p>
        <Dialog
          header={formsText('emptyRecordSetHeader')(recordSet.get('name'))}
          onClose={(): void => history.back()}
          buttons={
            <>
              <Button.DialogClose>{commonText('close')}</Button.DialogClose>
              {hasToolPermission('recordSets', 'delete') && (
                <Button.Red
                  onClick={(): void =>
                    loading(
                      recordSet
                        .destroy()
                        .then(
                          handleClose ??
                            ((): void => navigation.go('/specify/'))
                        )
                    )
                  }
                >
                  {commonText('delete')}
                </Button.Red>
              )}
              {hasToolPermission('recordSets', 'create') && (
                <Button.Green
                  onClick={(): void => handleAdd(new rest.model.Resource())}
                >
                  {commonText('add')}
                </Button.Green>
              )}
            </>
          }
        >
          {formsText('emptyRecordSetMessage')}
        </Dialog>
        {formsText('noData')}
      </p>
    )
  ) : (
    <RecordSelectorFromIds<SCHEMA>
      {...rest}
      ids={ids}
      title={title ?? recordSet.get('name')}
      isDependent={false}
      isAddingNew={isAddingNew}
      dialog={dialog}
      mode={mode}
      canAddAnother={canAddAnother}
      onClose={handleClose}
      totalCount={totalCount}
      defaultIndex={defaultResourceIndex ?? 0}
      onSaved={({ newResource, wasNew, resource }): void => {
        if (wasNew) {
          handleAdd(resource);
          navigation.push(resource.viewUrl());
        }
        if (typeof newResource === 'object') handleAdd(newResource);
      }}
      onAdd={hasToolPermission('recordSets', 'create') ? handleAdd : undefined}
      onDelete={
        recordSet.isNew() || hasToolPermission('recordSets', 'delete')
          ? (): void => {
              if (isAddingNew)
                setItems({ totalCount, ids, isAddingNew: false });
              else
                loading(
                  fetchCollection('RecordSetItem', {
                    limit: 1,
                    recordId: ids[index],
                    recordSet: recordSet.id,
                  }).then(({ records }) =>
                    ping(`/api/specify/recordsetitem/${records[0].id}/`, {
                      method: 'DELETE',
                    }).then(() => {
                      setItems({
                        totalCount: totalCount - 1,
                        ids: removeItem(ids, index),
                        isAddingNew: false,
                      });
                      setIndex((previousIndex) =>
                        clamp(
                          0,
                          totalCount - 1,
                          previousIndex > index ? index - 1 : index
                        )
                      );
                      if (totalCount === 1) handleClose();
                    })
                  )
                );
            }
          : undefined
      }
      onSlide={setIndex}
    />
  );
}
