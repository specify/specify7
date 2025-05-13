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
import type { QueryResultRow } from './Results';
import { QueryResults } from './Results';

// TODO: [FEATURE] allow customizing this and other constants as make sense
const fetchSize = 40;

export function QueryResultsWrapper({
  createRecordSet,
  extraButtons,
  onSelected: handleSelected,
  onReRun: handleReRun,
  ...props
}: ResultsProps & {
  readonly createRecordSet: JSX.Element | undefined;
  readonly extraButtons: JSX.Element | undefined;
  readonly onSelected?: (selected: RA<number>) => void;
  readonly onReRun: () => void;
}): JSX.Element | null {
  const newProps = useQueryResultsWrapper(props);

  return newProps === undefined ? (
    props.queryRunCount === 0 ? null : (
      <div className="flex-1 snap-start">{loadingGif}</div>
    )
  ) : (
    <div className="flex flex-1 snap-start overflow-hidden">
      <ErrorBoundary dismissible>
        <QueryResults
          {...newProps}
          createRecordSet={createRecordSet}
          extraButtons={extraButtons}
          onReRun={handleReRun}
          onSelected={handleSelected}
        />
      </ErrorBoundary>
    </div>
  );
}

type ResultsProps = {
  readonly table: SpecifyTable;
  readonly queryRunCount: number;
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

/**
 * Extracting the logic into a hook so that can be reused even outside the
 * Query Builder (in the Specify Network)
 */
export function useQueryResultsWrapper({
  table,
  queryRunCount,
  queryResource,
  fields,
  recordSetId,
  forceCollection,
  onSortChange: handleSortChange,
  selectedRows: [selectedRows, setSelectedRows],
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

    const query: SerializedResource<SpQuery> = {
      ...serializeResource(queryResource),
      fields: unParseQueryFields(table.name, allFields),
    };

    setTotalCount(undefined);
    ajax<{ readonly count: number }>('/stored_query/ephemeral/', {
      method: 'POST',
      errorMode: 'dismissible',
      headers: { Accept: 'application/json' },
      body: keysToLowerCase({
        ...query,
        ...fetchPayload,
        countOnly: true,
      }),
    })
      .then(({ data }) => setTotalCount(data.count))
      .catch(raise);

    const displayedFields = allFields.filter((field) => field.isDisplay);
    const countOnly = queryResource.get('countOnly') === true;
    const isCountOnly =
      countOnly ||
      // Run as "count only" if there are no visible fields
      displayedFields.length === 0;

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
          fetchSize,
          table,
          fetchResults: isCountOnly
            ? undefined
            : async (offset) => runQuery(query, { ...fetchPayload, offset }),
          allFields,
          displayedFields: queryFields,
          fieldSpecs,
          initialData,
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
