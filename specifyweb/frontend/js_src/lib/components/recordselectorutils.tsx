import React from 'react';

import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../collection';
import collectionapi from '../collectionapi';
import type { RecordSet as RecordSetSchema } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import formsText from '../localization/forms';
import * as navigation from '../navigation';
import * as queryString from '../querystring';
import specifyform from '../specifyform';
import type { Collection } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { clamp, f } from '../wbplanviewhelper';
import { Button, FormFooter, SubFormHeader } from './basic';
import { crash } from './errorboundary';
import { useAsyncState } from './hooks';
import { icons } from './icons';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { RecordSelectorProps } from './recordselector';
import { RecordSelector, RecordSelectorButtons } from './recordselector';

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
  const [isLoading, setIsLoading] = React.useState(true);

  const getRecords = React.useCallback(
    (): RA<SpecifyResource<SCHEMA> | undefined> =>
      Array.from(collection.models),
    [collection]
  );
  const [records, setRecords] =
    React.useState<RA<SpecifyResource<SCHEMA> | undefined>>(getRecords);

  const isDependent = collection instanceof collectionapi.Dependent;
  const isLazy = collection instanceof collectionapi.Lazy;

  // Fetch records if needed
  React.useEffect(() => {
    if (isLazy)
      Promise.resolve(collection.fetchIfNotPopulated())
        .then(() => setIsLoading(false))
        .then(() => setRecords(getRecords))
        .catch(crash);
    else setIsLoading(false);
  }, [collection, isLazy, getRecords]);

  // Listen for changes to collection
  React.useEffect(() => {
    const updateRecords = (): void => setRecords(getRecords);
    collection.on('add remove destroy', updateRecords);
    return (): void => collection.off('add remove destroy', updateRecords);
  }, [collection, getRecords]);

  const [index, setIndex] = useAsyncState(
    React.useCallback(
      () => defaultIndex ?? collection._totalCount ?? 0,
      [collection._totalCount, defaultIndex]
    )
  );

  return isLoading ? (
    // Don't display the loading screen for subForms
    typeof rest.field === 'undefined' ? (
      <LoadingScreen />
    ) : null
  ) : (
    <RecordSelector<SCHEMA>
      {...rest}
      totalCount={collection._totalCount ?? records.length}
      model={collection.model.specifyModel}
      relatedResource={collection.related}
      records={records}
      isDependent={isDependent}
      onAdd={(resource): void => {
        collection.add(resource);
        handleAdd?.(resource);
        // Updates the state to trigger a reRender
        setRecords(getRecords);
      }}
      onDelete={(): void => {
        collection.remove(defined(records[index ?? 0]));
        handleDelete?.();
        setRecords(getRecords);
      }}
      index={index ?? 0}
      onSlide={(index: number): void => {
        setIndex(index);
        if (
          isLazy &&
          index === collection.models.length - 1 &&
          !collection.isComplete()
        )
          collection.fetchIfNotFetching().catch(crash);
        handleSlide?.(index);
      }}
    >
      {children}
    </RecordSelector>
  );
}

/** A Wrapper for RecordSelector for easier usage in Backbone Views */
function IntegratedRecordSelector({
  subformNode,
  htmlElement = subformNode,
  isReadOnly = false,
  hasHeader = true,
  collection,
  onSlide: handleSlide,
  ...rest
}: Omit<
  Parameters<typeof RecordSelectorFromCollection>[0],
  | 'sliderPosition'
  | 'formType'
  | 'viewName'
  | 'isReadOnly'
  | 'hasHeader'
  | 'onSlide'
> & {
  readonly subformNode: HTMLElement;
  readonly htmlElement?: HTMLElement;
  readonly isReadOnly?: boolean;
  readonly hasHeader?: boolean;
  readonly onSlide?: (index: number) => void;
}): JSX.Element {
  return (
    <RecordSelectorFromCollection
      collection={collection}
      isReadOnly={isReadOnly || specifyform.subViewMode(subformNode) === 'view'}
      defaultIndex={getDefaultIndex(
        htmlElement.dataset['url-param'] ?? '',
        collection.models.length
      )}
      onSlide={(index): void => {
        if (typeof htmlElement.dataset['url-param'] === 'string')
          setQueryParameter(htmlElement.dataset['url-param'], index);
        handleSlide?.(index);
      }}
      formType={specifyform.getSubViewType(subformNode)}
      viewName={htmlElement.dataset['specify-viewname']}
      {...rest}
    >
      {({
        dialogs,
        slider,
        index,
        resourceView,
        onAdd: handleAdd,
        onRemove: handleRemove,
      }): JSX.Element => {
        const isDependent = collection instanceof collectionapi.Dependent;
        const handleVisit =
          typeof collection.models[index] === 'object' && !isDependent
            ? (): void => navigation.go(collection.models[index].viewUrl())
            : undefined;
        const buttons = isReadOnly ? undefined : (
          <RecordSelectorButtons
            onVisit={handleVisit}
            onDelete={
              typeof collection.models[index] === 'object'
                ? handleRemove
                : undefined
            }
            onAdd={handleAdd}
          />
        );
        const sliderAtTop = htmlElement.classList.contains('slider-at-top');
        const children = (
          <>
            {dialogs}
            {hasHeader && (
              <SubFormHeader>
                <legend>
                  {typeof handleVisit === 'function' && (
                    <Button.LikeLink
                      title={formsText('link')}
                      aria-label={formsText('link')}
                      onClick={handleVisit}
                    >
                      {icons.chevronRight}
                    </Button.LikeLink>
                  )}
                  <span>{`${
                    collection.field?.label ??
                    collection.model.specifyModel?.label
                  } (${collection.models.length})`}</span>
                </legend>
                {buttons}
              </SubFormHeader>
            )}
            {sliderAtTop && slider}
            {resourceView ?? <p>{formsText('noData')}</p>}
            {!hasHeader && <FormFooter>{buttons}</FormFooter>}
            {!sliderAtTop && slider}
          </>
        );
        return hasHeader ? <fieldset>{children}</fieldset> : children;
      }}
    </RecordSelectorFromCollection>
  );
}

export const RecordSelectorView = createBackboneView(
  IntegratedRecordSelector,
  false
);

/**
 * A Wrapper for RecordSelector that allows to specify list of records by their
 * IDs
 */
export function RecordSelectorFromIds<SCHEMA extends AnySchema>({
  ids,
  onSlide: handleSlide,
  children,
  defaultIndex,
  ...rest
}: {
  /*
   * Undefined IDs are placeholders for items with unknown IDs (e.g in record
   * sets or query results with thousands of items)
   */
  readonly ids: RA<number | undefined>;
  readonly defaultIndex?: number;
} & Omit<
  RecordSelectorProps<SCHEMA>,
  'relatedResource' | 'records' | 'isDependent' | 'index'
>): JSX.Element | null {
  const [records, setRecords] = React.useState<
    RA<SpecifyResource<SCHEMA> | undefined>
  >(() =>
    ids.map((id) =>
      typeof id === 'undefined' ? undefined : new rest.model.Resource({ id })
    )
  );

  const previousIds = React.useRef(ids);
  React.useEffect(() => {
    setRecords((records) =>
      ids.map((id, index) =>
        typeof id === 'undefined'
          ? undefined
          : records[index] ?? new rest.model.Resource({ id })
      )
    );

    return (): void => {
      previousIds.current = ids;
    };
  }, [ids, rest.model]);

  const [index, setIndex] = React.useState(defaultIndex ?? ids.length - 1);

  return (
    <RecordSelector<SCHEMA>
      {...rest}
      records={records}
      isDependent={false}
      index={index}
      onSlide={(index: number): void => {
        setIndex(index);
        handleSlide?.(index);
      }}
    >
      {children}
    </RecordSelector>
  );
}

const fetchItems = async (
  recordSetId: number,
  offset: number
): Promise<
  (props: {
    readonly totalItems: number;
    readonly ids: RA<number | undefined>;
  }) => { readonly totalItems: number; readonly ids: RA<number | undefined> }
> =>
  fetchCollection('RecordSetItem', {
    limit: DEFAULT_FETCH_LIMIT,
    recordSet: recordSetId,
    orderBy: 'recordId',
    offset,
  }).then(({ records, totalCount }) => ({ ids }) => ({
    totalItems: totalCount,
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
  children,
  ...rest
}: Omit<
  RecordSelectorProps<SCHEMA>,
  'mode' | 'isDependent' | 'records' | 'field' | 'defaultIndex'
> & {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
  readonly defaultResourceIndex: number | undefined;
}): JSX.Element {
  const [{ totalItems, ids }, setItems] = React.useState<{
    readonly totalItems: number;
    readonly ids: RA<number | undefined>;
  }>({
    totalItems: 0,
    ids: [undefined],
  });

  const [index, setIndex] = React.useState(defaultResourceIndex ?? 0);

  // Fetch ID of record at current index
  const currentRecordId = ids?.[index];
  const previousIndex = React.useRef<number>(index);
  React.useEffect(() => {
    if (typeof currentRecordId === 'undefined')
      fetchItems(
        recordSet.id,
        // If new index is smaller (i.e, going back), fetch previous 20 elements
        previousIndex.current > index ? index - DEFAULT_FETCH_LIMIT : index
      )
        .then(setItems)
        .catch(crash);
    return (): void => {
      previousIndex.current = index;
    };
  }, [currentRecordId, index, recordSet.id]);

  return (
    <RecordSelectorFromIds<SCHEMA>
      {...rest}
      ids={ids}
      totalCount={totalItems}
      defaultIndex={defaultResourceIndex ?? 0}
      onAdd={(resource): void => {
        resource.recordsetid = recordSet.id;
        setItems({ totalItems: totalItems + 1, ids: [...ids, resource.id] });
        setIndex(totalItems);
      }}
      onDelete={(): void => {
        // TODO: handle case when totalCount becomes 0
        setItems({
          totalItems: totalItems - 1,
          ids: [...ids.slice(0, index), ...ids.slice(index + 1)],
        });
        setIndex((previousIndex) =>
          clamp(0, totalItems - 1, previousIndex > index ? index - 1 : index)
        );
      }}
      onSlide={setIndex}
      onSaved={f.void}
    >
      {children}
    </RecordSelectorFromIds>
  );
}

/** A Wrapper for RecordSetView for easier usage in Backbone Views */
export function IntegratedRecordSetView({
  subformNode,
  htmlElement = subformNode,
  isReadOnly = false,
  hasHeader = true,
  ...rest
}: Omit<Parameters<typeof RecordSet>[0], 'formType'> & {
  readonly subformNode: HTMLElement;
  readonly htmlElement?: HTMLElement;
  readonly isReadOnly?: boolean;
  readonly hasHeader?: boolean;
  readonly onSlide?: (index: number) => void;
}): JSX.Element {
  return (
    <RecordSet
      isReadOnly={isReadOnly || specifyform.subViewMode(subformNode) === 'view'}
      viewName={htmlElement.dataset['specify-viewname']}
      {...rest}
    >
      {({
        dialogs,
        slider,
        totalCount,
        resource,
        resourceView,
        onAdd: handleAdd,
        onRemove: handleRemove,
      }): JSX.Element => {
        const handleVisit =
          typeof resource === 'object'
            ? (): void => navigation.go(resource.viewUrl())
            : undefined;
        const buttons = isReadOnly ? undefined : (
          <RecordSelectorButtons
            onVisit={handleVisit}
            onDelete={typeof resource === 'object' ? handleRemove : undefined}
            onAdd={handleAdd}
          />
        );
        const wrappedSlider = (
          <div className="contents" title={rest.recordSet.get('name')}>
            {slider}
          </div>
        );
        const sliderAtTop = htmlElement.classList.contains('slider-at-top');
        const children = (
          <>
            {dialogs}
            {hasHeader && (
              <SubFormHeader>
                <legend>
                  {typeof handleVisit === 'function' && (
                    <Button.LikeLink
                      title={formsText('link')}
                      aria-label={formsText('link')}
                      onClick={handleVisit}
                    >
                      {icons.chevronRight}
                    </Button.LikeLink>
                  )}
                  <span>{`${rest.model.label} (${totalCount})`}</span>
                </legend>
                {buttons}
              </SubFormHeader>
            )}
            {sliderAtTop && wrappedSlider}
            {resourceView ?? <p>{formsText('noData')}</p>}
            {!hasHeader && <FormFooter>{buttons}</FormFooter>}
            {!sliderAtTop && wrappedSlider}
          </>
        );
        return hasHeader ? <fieldset>{children}</fieldset> : children;
      }}
    </RecordSet>
  );
}

export const RecordSetView = createBackboneView(IntegratedRecordSetView);
