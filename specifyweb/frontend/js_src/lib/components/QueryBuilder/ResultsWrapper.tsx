import React from 'react';

import { ajax } from '../../utils/ajax';
import type { GetSet, RA } from '../../utils/types';
import { keysToLowerCase, replaceItem } from '../../utils/utils';
import type {
  SerializedRecord,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpQuery } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { loadingGif } from '../Molecules';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import type { QueryField } from './helpers';
import {
  augmentQueryFields,
  queryFieldIsPhantom,
  queryFieldsToFieldSpecs,
  unParseQueryFields,
} from './helpers';
import type { QueryResultRow, QueryResultsSplitPaneProps } from './Results';
import { QueryResults } from './Results';
import { SplitView } from './SplitView';

// TODO: [FEATURE] allow customizing this and other constants as make sense
const fetchSize = 40;

export function QueryResultsWrapper({
  createRecordSet,
  extraButtons,
  onSelected: handleSelected,
  onResults: handleResults,
  onDeleted: handleDeleted,
  onReRun: handleReRun,
  renderSplitPane,
  onMerged: handleMerged,
  refreshToken,
  splitPane,
  splitContainerRef,
  splitHorizontal,
  splitPrimaryPaneMaxWidth,
  isSplit,
  ...props
}: ResultsProps & {
  readonly createRecordSet: JSX.Element | undefined;
  readonly extraButtons: JSX.Element | undefined;
  readonly onSelected?: (selected: RA<number>) => void;
  readonly onResults?: (results: RA<QueryResultRow | undefined>) => void;
  readonly scrollRef?: React.MutableRefObject<HTMLDivElement | null>;
  readonly restoreScrollTopRef?: React.MutableRefObject<number | undefined>;
  readonly refreshToken?: number;
  readonly splitPane?: JSX.Element;
  readonly splitContainerRef?: React.RefCallback<HTMLDivElement>;
  readonly splitHorizontal?: boolean;
  readonly splitPrimaryPaneMaxWidth?: string;
  readonly isSplit?: boolean;
  readonly onReRun: () => void;
  readonly renderSplitPane?: (props: QueryResultsSplitPaneProps) => JSX.Element;
}): JSX.Element | null {
  const newProps = useQueryResultsWrapper(props);

  if (newProps === undefined)
    return props.queryRunCount === 0 ? null : (
      <div className="flex-1 snap-start">{loadingGif}</div>
    );

  const queryResults = (
    <div
      className="flex flex-1 snap-start overflow-hidden"
      ref={renderSplitPane === undefined ? undefined : splitContainerRef}
    >
      <ErrorBoundary dismissible>
        <QueryResults
          {...newProps}
          onResults={handleResults}
          onDeleted={handleDeleted}
          createRecordSet={createRecordSet}
          extraButtons={extraButtons}
          onReRun={handleReRun}
          renderSplitPane={renderSplitPane}
          isSplit={isSplit}
          splitHorizontal={splitHorizontal}
          splitPrimaryPaneMaxWidth={splitPrimaryPaneMaxWidth}
          onMerged={handleMerged}
          onSelected={handleSelected}
          refreshToken={refreshToken}
        />
      </ErrorBoundary>
    </div>
  );

  return splitPane === undefined ? (
    queryResults
  ) : (
    <div
      className="flex h-full max-h-full min-h-0 min-w-0 flex-1 overflow-hidden"
      ref={splitContainerRef}
    >
      <SplitView
        isHorizontal={splitHorizontal ?? true}
        isSplit={isSplit}
        primaryPane={queryResults}
        primaryPaneKey="query-results"
        primaryPaneMaxWidth={splitPrimaryPaneMaxWidth}
        secondaryPane={splitPane}
        secondaryPaneKey="split-pane"
      />
    </div>
  );
}

type ResultsProps = {
  readonly table: SpecifyTable;
  readonly queryRunCount: number;
  readonly countOnly?: boolean;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly recordSetId: number | undefined;
  readonly forceCollection: number | undefined;
  readonly onSortChange?: (
    /*
     * Since this component may add fields to the query, it needs to send back
     * all of the fields but still skips phantom fields because they are not displayed
     * in the results table
     */
    newFields: RA<QueryField>
  ) => void;
  readonly selectedRows: GetSet<ReadonlySet<number>>;
  readonly containerClassName?: string;
  readonly tableClassName?: string;
  readonly onResults?: (results: RA<QueryResultRow | undefined>) => void;
  readonly onDeleted?: (recordId: number) => void;
  readonly onMerged?: () => void;
  readonly scrollRef?: React.MutableRefObject<HTMLDivElement | null>;
  readonly restoreScrollTopRef?: React.MutableRefObject<number | undefined>;
  readonly resultsRef?: React.MutableRefObject<
    RA<QueryResultRow | undefined> | undefined
  >;
};

type PartialProps = Omit<
  Parameters<typeof QueryResults>[0],
  'createRecordSet' | 'extraButtons' | 'model' | 'onReRun' | 'onSelected'
>;

export const runQuery = async <ROW_TYPE extends QueryResultRow>(
  query: SerializedRecord<SpQuery> | SerializedResource<SpQuery>,
  extras: Partial<{
    readonly collectionId: number;
    readonly limit: number;
    readonly offset: number;
    readonly recordSetId: number;
  }> = {}
): Promise<RA<ROW_TYPE>> =>
  ajax<{
    readonly results: RA<ROW_TYPE>;
  }>('/stored_query/ephemeral/', {
    method: 'POST',
    errorMode: 'dismissible',

    headers: { Accept: 'application/json' },
    body: keysToLowerCase({
      ...query,
      ...extras,
    }),
  }).then(({ data }) => data.results);

const runQueryCount = async (
  query: SerializedRecord<SpQuery> | SerializedResource<SpQuery>,
  extras: Partial<{
    readonly collectionId: number;
    readonly limit: number;
    readonly recordSetId: number;
  }> = {}
): Promise<number> =>
  ajax<{ readonly count: number }>('/stored_query/ephemeral/', {
    method: 'POST',
    errorMode: 'dismissible',
    headers: { Accept: 'application/json' },
    body: keysToLowerCase({
      ...query,
      ...extras,
      countOnly: true,
    }),
  }).then(({ data }) => data.count);

/**
 * Extracting the logic into a hook so that can be reused even outside the
 * Query Builder (in the Specify Network)
 */
export function useQueryResultsWrapper({
  table,
  queryRunCount,
  countOnly,
  queryResource,
  fields,
  recordSetId,
  forceCollection,
  containerClassName,
  tableClassName,
  onSortChange: handleSortChange,
  onResults: handleResults,
  onMerged: handleMerged,
  selectedRows: [selectedRows, setSelectedRows],
  scrollRef,
  restoreScrollTopRef,
  resultsRef,
}: ResultsProps): PartialProps | undefined {
  /*
   * Need to store all props in a state so that query field edits do not affect
   * the query results until query is reRun
   */
  const [props, setProps] = React.useState<
    Omit<PartialProps, 'resultsRef' | 'selectedRows' | 'totalCount'> | undefined
  >(undefined);

  const [totalCount, setTotalCount] = React.useState<number | undefined>(
    undefined
  );

  const previousQueryRunCount = React.useRef(0);
  React.useEffect(() => {
    if (queryRunCount === previousQueryRunCount.current) return;
    previousQueryRunCount.current = queryRunCount;
    // Display the loading GIF
    setProps(undefined);

    const isDistinct = queryResource.get('selectDistinct') === true;
    const allFields = augmentQueryFields(
      table.name,
      fields.filter(({ mappingPath }) => mappingPathIsComplete(mappingPath)),
      isDistinct
    );

    const fetchPayload = {
      collectionId: forceCollection,
      recordSetId,
      limit: fetchSize,
    };

    const displayedFields = allFields.filter((field) => field.isDisplay);
    const isCountOnly =
      countOnly === undefined
        ? queryResource.get('countOnly') === true ||
          // Run as "count only" if there are no visible fields
          displayedFields.length === 0
        : countOnly || displayedFields.length === 0;

    const query: SerializedResource<SpQuery> = {
      ...serializeResource(queryResource),
      fields: unParseQueryFields(table.name, allFields),
      countOnly: isCountOnly,
    };

    setTotalCount(undefined);
    const fetchCount = async (): Promise<number> =>
      runQueryCount(query, fetchPayload);
    fetchCount().then(setTotalCount).catch(raise);

    const initialData = isCountOnly
      ? Promise.resolve(undefined)
      : runQuery(query, { offset: 0, ...fetchPayload });
    const fieldSpecsAndFields = queryFieldsToFieldSpecs(
      table.name,
      displayedFields
    );
    const fieldSpecs = fieldSpecsAndFields.map(
      ([_field, fieldSpec]) => fieldSpec
    );
    const queryFields = fieldSpecsAndFields.map(([field]) => field);

    initialData
      .then((initialData) =>
        setProps({
          queryResource,
          containerClassName,
          tableClassName,
          fetchSize,
          table,
          fetchResults: isCountOnly
            ? undefined
            : async (offset) => runQuery(query, { ...fetchPayload, offset }),
          fetchCount,
          allFields,
          displayedFields: queryFields,
          fieldSpecs,
          initialData,
          onResults: handleResults,
          onMerged: handleMerged,
          scrollRef,
          restoreScrollTopRef,
          sortConfig: queryFields
            .filter(({ isDisplay }) => isDisplay)
            .map((field) => field.sortType),
          onSortChange:
            typeof handleSortChange === 'function'
              ? (fieldSpec, sortType): void => {
                  /*
                   * If some fields are not displayed, visual index and actual field
                   * index differ. Also needs to skip phantom fields (added by locality)
                   */
                  const index = fieldSpecs.indexOf(fieldSpec);
                  const displayField = displayedFields[index];
                  const lineIndex = allFields.indexOf(displayField);
                  handleSortChange(
                    replaceItem(
                      allFields.filter((field) => !queryFieldIsPhantom(field)),
                      lineIndex,
                      {
                        ...displayField,
                        sortType,
                      }
                    )
                  );
                }
              : undefined,
        })
      )
      .catch(raise);
  }, [
    fields,
    table,
    forceCollection,
    queryResource,
    queryRunCount,
    recordSetId,
    handleMerged,
    countOnly,
  ]);

  return props === undefined
    ? undefined
    : {
        ...props,
        totalCount,
        selectedRows: [selectedRows, setSelectedRows],
        resultsRef,
      };
}
