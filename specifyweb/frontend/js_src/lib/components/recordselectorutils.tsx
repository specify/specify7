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
import { Button, className, FormFooter, H2, SubFormHeader } from './basic';
import { DeleteButton } from './deletebutton';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState } from './hooks';
import { icons } from './icons';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { RecordSelectorProps } from './recordselector';
import { RecordSelector, RecordSelectorButtons } from './recordselector';
import { ResourceView } from './resourceview';
import { removeItem } from './wbplanviewstate';

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

  // Fetch records if needed
  React.useEffect(() => {
    if (isLazy)
      Promise.resolve(collection.fetchPromise())
        .then(handleLoaded)
        .then(() => setRecords(getRecords))
        .catch(crash);
    else handleLoaded();
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

  return isLoaded ? (
    <RecordSelector<SCHEMA>
      {...rest}
      totalCount={collection._totalCount ?? records.length}
      model={collection.model.specifyModel}
      relatedResource={isDependent ? collection.related : undefined}
      records={records}
      onAdd={(resource): void => {
        collection.add(resource);
        handleAdd?.(resource);
        // Updates the state to trigger a reRender
        setRecords(getRecords);
      }}
      onDelete={(): void => {
        collection.remove(defined(records[index ?? 0]));
        handleDelete?.(index ?? 0);
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
  ) : // Don't display the loading screen for subForms
  typeof rest.field === 'undefined' ? (
    <LoadingScreen />
  ) : null;
}

export const subFormNodeToProps = (
  subFormNode: HTMLElement
): {
  readonly isReadOnly: boolean;
  readonly buildView: () => Promise<HTMLFormElement>;
} => ({
  isReadOnly: specifyform.subViewMode(subFormNode) === 'view',
  buildView: async (): Promise<HTMLFormElement> =>
    specifyform
      .buildSubView(subFormNode)
      .then(
        (form) =>
          (form?.[0] as HTMLFormElement) ?? document.createElement('form')
      ),
});

/** A Wrapper for RecordSelector for easier usage in Backbone Views */
function IntegratedRecordSelector({
  urlParameter,
  buildView = async (): Promise<HTMLFormElement> =>
    specifyform
      .buildViewByName(
        collection.model.specifyModel.view,
        isReadOnly ? 'view' : 'edit'
      )
      .then((form) => form[0] as HTMLFormElement),
  isReadOnly = false,
  hasHeader = true,
  collection,
  ...rest
}: Omit<
  Parameters<typeof RecordSelectorFromCollection>[0],
  'isReadOnly' | 'onSlide'
> & {
  readonly buildView?: () => Promise<HTMLFormElement>;
  readonly subformNode: HTMLElement;
  readonly htmlElement?: HTMLElement;
  readonly urlParameter?: string;
  readonly isReadOnly?: boolean;
  readonly hasHeader?: boolean;
}): JSX.Element {
  const isDependent = collection instanceof collectionapi.Dependent;
  return (
    <RecordSelectorFromCollection
      collection={collection}
      defaultIndex={getDefaultIndex(
        urlParameter ?? '',
        collection.models.length
      )}
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
        index,
        resource,
        onAdd: handleAdd,
        onRemove: handleRemove,
      }): JSX.Element => {
        const handleVisit =
          typeof collection.models[index] === 'object' && !isDependent
            ? (): void => navigation.go(collection.models[index].viewUrl())
            : undefined;
        const buttons = isReadOnly ? undefined : (
          <RecordSelectorButtons
            onVisit={hasHeader ? undefined : handleVisit}
            onDelete={
              typeof collection.models[index] === 'object'
                ? handleRemove
                : undefined
            }
            onAdd={handleAdd}
          />
        );
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
            {typeof resource === 'object' ? (
              <ResourceView
                resource={defined(resource)}
                buildView={buildView}
                isReadOnly={isReadOnly}
                canAddAnother={false}
                onSaved={f.void}
              >
                {({ form }): JSX.Element => form}
              </ResourceView>
            ) : (
              <p>{formsText('noData')}</p>
            )}
            {!hasHeader && typeof buttons === 'object' ? (
              <FormFooter>{buttons}</FormFooter>
            ) : undefined}
            {slider}
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
    readonly totalCount: number;
    readonly ids: RA<number | undefined>;
  }) => { readonly totalCount: number; readonly ids: RA<number | undefined> }
> =>
  fetchCollection('RecordSetItem', {
    limit: DEFAULT_FETCH_LIMIT,
    recordSet: recordSetId,
    offset,
  }).then(({ records, totalCount }) => ({ ids }) => ({
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
  children,
  ...rest
}: Omit<
  RecordSelectorProps<SCHEMA>,
  'mode' | 'isDependent' | 'records' | 'field' | 'defaultIndex' | 'totalCount'
> & {
  readonly recordSet: SpecifyResource<RecordSetSchema>;
  readonly defaultResourceIndex: number | undefined;
}): JSX.Element {
  const [{ totalCount, ids }, setItems] = React.useState<{
    readonly totalCount: number;
    readonly ids: RA<number | undefined>;
  }>({
    totalCount: 0,
    ids: [],
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

  /*
   * FIXME: handle empty record set case
   * formsText('emptyRecordSetHeader')
   * formsText('emptyRecordSetSecondMessage')
   */

  return (
    <RecordSelectorFromIds<SCHEMA>
      {...rest}
      ids={ids}
      totalCount={totalCount}
      defaultIndex={defaultResourceIndex ?? 0}
      onAdd={(resource): void => {
        resource.recordsetid = recordSet.id;
        setItems({ totalCount: totalCount + 1, ids: [...ids, resource.id] });
        setIndex(totalCount);
      }}
      onDelete={(): void => {
        setItems({
          totalCount: totalCount - 1,
          ids: removeItem(ids, index),
        });
        setIndex((previousIndex) =>
          clamp(0, totalCount - 1, previousIndex > index ? index - 1 : index)
        );
      }}
      onSlide={setIndex}
    >
      {children}
    </RecordSelectorFromIds>
  );
}

/** A Wrapper for RecordSetView for easier usage in Backbone Views */
function IntegratedRecordSetView({
  isReadOnly = false,
  ...rest
}: Parameters<typeof RecordSet>[0] & {
  readonly isReadOnly?: boolean;
}): JSX.Element {
  return (
    <RecordSet {...rest}>
      {({
        dialogs,
        slider,
        resource,
        onAdd: handleAdd,
        onRemove: handleRemove,
      }): JSX.Element =>
        typeof resource === 'object' ? (
          <ResourceView
            resource={defined(resource)}
            buildView={async () =>
              specifyform
                .buildViewByName(
                  defined(resource).specifyModel.view,
                  'form',
                  isReadOnly ? 'view' : 'edit'
                )
                .then((form) => form[0] as HTMLFormElement)
            }
            isReadOnly={isReadOnly}
            canAddAnother={true}
            onSaved={({ wasNew, newResource }): void => {
              if (wasNew) navigation.go(resource.viewUrl());
              if (typeof newResource === 'object') handleAdd(newResource);
            }}
          >
            {({
              form,
              title,
              saveButton,
              specifyNetworkBadge,
            }): JSX.Element => (
              <>
                {dialogs}
                <header className={className.formHeader}>
                  <H2 className={className.formTitle}>{title}</H2>
                  {slider}
                  {specifyNetworkBadge}
                </header>
                {form}
                <FormFooter>
                  {!resource.isNew() && !isReadOnly ? (
                    <DeleteButton model={resource} onDeleted={handleRemove} />
                  ) : undefined}
                  {saveButton}
                </FormFooter>
              </>
            )}
          </ResourceView>
        ) : (
          <p>
            {dialogs}
            {formsText('noData')}
          </p>
        )
      }
    </RecordSet>
  );
}

export const RecordSetView = createBackboneView(IntegratedRecordSetView);
