import React from 'react';

import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../collection';
import collectionapi from '../collectionapi';
import type { RecordSet as RecordSetSchema } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import * as navigation from '../navigation';
import type { FormMode, FormType } from '../parseform';
import * as queryString from '../querystring';
import type { Collection } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { clamp, removeItem } from '../helpers';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { Button } from './basic';
import { crash } from './errorboundary';
import { FormTableCollection } from './formtable';
import { useBooleanState, useTriggerState } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';
import type { RecordSelectorProps } from './recordselector';
import { BaseRecordSelector, RecordSelectorButtons } from './recordselector';
import { augmentMode, ResourceView } from './resourceview';
import { hasTablePermission, hasToolPermission } from '../permissions';

function getDefaultIndex(queryParameter: string, lastIndex: number): number {
  const parameters = queryString.parse();
  const index = Number.parseInt(parameters[queryParameter]);
  return parameters[queryParameter] === 'end'
    ? lastIndex
    : Number.isNaN(index)
    ? 0
    : index;
}

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

  // FIXME: disable onAdd and onDelete if no permission
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
}): JSX.Element {
  const isDependent = collection instanceof collectionapi.Dependent;
  const field = defined(collection.field?.getReverse());
  const isToOne = !relationshipIsToMany(field);
  const disableAdding =
    (isToOne && collection.models.length > 0) ||
    !hasTablePermission(field.relatedModel.name, 'create');
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
                <RecordSelectorButtons
                  visitHref={
                    typeof resource === 'object' &&
                    (!isDependent || dialog !== false)
                      ? resource.viewUrl()
                      : undefined
                  }
                  onDelete={
                    typeof resource === 'object' &&
                    mode !== 'view' &&
                    (resource.isNew() ||
                      hasTablePermission(resource.specifyModel.name, 'delete'))
                      ? handleRemove
                      : undefined
                  }
                  onAdd={
                    mode === 'view' || disableAdding ? undefined : handleAdd
                  }
                />
                <span className="flex-1 -ml-4" />
                {!isToOne && slider}
              </>
            }
            mode={mode}
            viewName={viewName}
            isSubForm={dialog === false}
            canAddAnother={false}
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
  readonly defaultIndex?: number;
  readonly title: string | undefined;
  readonly dialog: false | 'modal' | 'nonModal';
  readonly isDependent: boolean;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly onClose: () => void;
  readonly canAddAnother: boolean;
  readonly onSaved: (payload: {
    readonly addAnother: boolean;
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
            id,
          })
    )
  );

  const previousIds = React.useRef(ids);
  React.useEffect(() => {
    setRecords((records) =>
      ids.map((id, index) =>
        typeof id === 'undefined'
          ? undefined
          : records[index] ?? new model.Resource({ id })
      )
    );

    return (): void => {
      previousIds.current = ids;
    };
  }, [ids, model]);

  const [index, setIndex] = React.useState(defaultIndex ?? ids.length - 1);

  return (
    <BaseRecordSelector<SCHEMA>
      {...rest}
      model={model}
      records={records}
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
                <RecordSelectorButtons
                  visitHref={
                    typeof resource === 'object' &&
                    (!isDependent || dialog !== false)
                      ? resource.viewUrl()
                      : undefined
                  }
                  onDelete={
                    typeof resource === 'object' &&
                    mode !== 'view' &&
                    (resource.isNew() ||
                      hasTablePermission(resource.specifyModel.name, 'delete'))
                      ? handleRemove
                      : undefined
                  }
                  onAdd={mode === 'view' ? undefined : handleAdd}
                />
                <span className="flex-1 -ml-4" />
                {slider}
              </>
            }
            mode={mode}
            viewName={viewName}
            isSubForm={dialog === false}
            canAddAnother={canAddAnother}
            onSaved={handleSaved}
            onDeleted={ids.length > 1 ? undefined : handleClose}
            onClose={handleClose}
          />
          {dialogs}
        </>
      )}
    </BaseRecordSelector>
  );
}

const fetchItems = async (
  recordSetId: number,
  offset: number
): Promise<
  (
    props:
      | {
          readonly ids: RA<number | undefined>;
        }
      | undefined
  ) => { readonly totalCount: number; readonly ids: RA<number | undefined> }
> =>
  fetchCollection('RecordSetItem', {
    limit: DEFAULT_FETCH_LIMIT,
    recordSet: recordSetId,
    offset,
  }).then(({ records, totalCount }) => ({ ids } = { ids: [] }) => ({
    totalCount,
    ids: records
      .map(({ recordId }, index) => [offset + index, recordId] as const)
      .reduce(
        (items, [order, recordId]) => {
          items[order] = recordId;
          return items;
        },
        typeof ids === 'undefined' ? [] : Array.from(ids)
      ),
  }));

export function RecordSet<SCHEMA extends AnySchema>({
  recordSet,
  defaultResourceIndex,
  title,
  dialog,
  mode,
  onClose: handleClose,
  canAddAnother,
  onSaved: handleSaved,
  onDeleted: handleDeleted,
  ...rest
}: Omit<
  RecordSelectorProps<SCHEMA>,
  | 'records'
  | 'field'
  | 'defaultIndex'
  | 'totalCount'
  | 'children'
  | 'onDelete'
  | 'index'
> & {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
  readonly defaultResourceIndex: number | undefined;
  readonly title: string | undefined;
  readonly dialog: false | 'modal' | 'nonModal';
  readonly mode: FormMode;
  readonly onClose: () => void;
  readonly canAddAnother: boolean;
  readonly onSaved: (payload: {
    readonly addAnother: boolean;
    readonly newResource: SpecifyResource<SCHEMA> | undefined;
    readonly wasNew: boolean;
  }) => void;
  readonly onDeleted: (newCount: number) => void;
}): JSX.Element {
  const [items, setItems] = React.useState<
    | {
        readonly totalCount: number;
        readonly ids: RA<number | undefined>;
      }
    | undefined
  >(undefined);
  const { totalCount, ids } = items ?? { totalCount: 0, ids: [] };

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
        .then(setItems)
        .catch(crash);
    return (): void => {
      previousIndex.current = index;
    };
  }, [totalCount, currentRecordId, index, recordSet.id]);

  function handleAdd(resource: SpecifyResource<SCHEMA>): void {
    resource.recordsetid = recordSet.id;
    setItems({ totalCount: totalCount + 1, ids: [...ids, resource.id] });
    setIndex(totalCount);
  }

  return totalCount === 0 ? (
    typeof items === 'undefined' ? (
      <LoadingScreen />
    ) : (
      <p>
        <Dialog
          header={formsText('emptyRecordSetHeader')}
          onClose={(): void => history.back()}
          buttons={
            <>
              <Button.DialogClose>{commonText('close')}</Button.DialogClose>
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
          {formsText('emptyRecordSetSecondMessage')}
        </Dialog>
        {formsText('noData')}
      </p>
    )
  ) : (
    <RecordSelectorFromIds<SCHEMA>
      {...rest}
      ids={ids}
      title={title}
      isDependent={false}
      dialog={dialog}
      mode={mode}
      canAddAnother={canAddAnother}
      onClose={handleClose}
      totalCount={totalCount}
      defaultIndex={defaultResourceIndex ?? 0}
      onSaved={handleSaved}
      onAdd={hasToolPermission('recordSets', 'create') ? handleAdd : undefined}
      onDelete={
        recordSet.isNew() || hasToolPermission('recordSets', 'delete')
          ? (): void => {
              setItems({
                totalCount: totalCount - 1,
                ids: removeItem(ids, index),
              });
              setIndex((previousIndex) =>
                clamp(
                  0,
                  totalCount - 1,
                  previousIndex > index ? index - 1 : index
                )
              );
              handleDeleted(totalCount - 1);
            }
          : undefined
      }
      onSlide={setIndex}
    />
  );
}
