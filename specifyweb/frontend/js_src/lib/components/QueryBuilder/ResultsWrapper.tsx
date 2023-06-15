import React from 'react';

import { ajax } from '../../utils/ajax';
import type { GetSet, IR, RA } from '../../utils/types';
import { keysToLowerCase, replaceItem } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpQuery, Tables } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { loadingGif } from '../Molecules';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import type { QueryField } from './helpers';
import {
  augmentQueryFields,
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
  model,
  onSelected: handleSelected,
  ...props
}: ResultsProps & {
  readonly model: SpecifyModel;
  readonly createRecordSet: JSX.Element | undefined;
  readonly extraButtons: JSX.Element | undefined;
  readonly onSelected?: (selected: RA<number>) => void;
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
          model={model}
          onSelected={handleSelected}
        />
      </ErrorBoundary>
    </div>
  );
}

type ResultsProps = {
  readonly baseTableName: keyof Tables;
  readonly queryRunCount: number;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly recordSetId: number | undefined;
  readonly forceCollection: number | undefined;
  readonly onSortChange?: (
    /*
     * Since this component may add fields to the query, it needs to send back
     * all of the fields
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
  'createRecordSet' | 'extraButtons' | 'model' | 'onSelected'
>;

const fetchResults = async (
  fetchPayload: IR<unknown>,
  offset: number
): Promise<RA<QueryResultRow>> =>
  ajax<{ readonly results: RA<QueryResultRow> }>('/stored_query/ephemeral/', {
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { Accept: 'application/json' },
    body: { ...fetchPayload, offset },
  }).then(({ data }) => data.results);

/**
 * Extracting the logic into a hook so that can be reused even outside the
 * Query Builder (in the Specify Network)
 */
export function useQueryResultsWrapper({
  baseTableName,
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
      baseTableName,
      fields.filter(({ mappingPath }) => mappingPathIsComplete(mappingPath)),
      queryResource.get('selectDistinct')
    );

    const fetchPayload = keysToLowerCase({
      ...queryResource.toJSON(),
      fields: unParseQueryFields(baseTableName, allFields),
      collectionId: forceCollection,
      recordSetId,
      limit: fetchSize,
    });

    setTotalCount(undefined);
    ajax<{ readonly count: number }>('/stored_query/ephemeral/', {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
      body: keysToLowerCase({
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
      : fetchResults(fetchPayload, 0);
    const fieldSpecsAndFields = queryFieldsToFieldSpecs(
      baseTableName,
      displayedFields
    );
    const fieldSpecs = fieldSpecsAndFields.map(
      ([_field, fieldSpec]) => fieldSpec
    );
    const queryFields = fieldSpecsAndFields.map(([field]) => field);

    initialData
      .then((initialData) =>
        setProps({
          hasIdField: !isDistinct,
          queryResource,
          fetchSize,
          fetchResults: isCountOnly
            ? undefined
            : fetchResults.bind(undefined, fetchPayload),
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
                   * index differ
                   */
                  const index = fieldSpecs.indexOf(fieldSpec);
                  const field = displayedFields[index];
                  handleSortChange(
                    replaceItem(allFields, index, {
                      ...field,
                      sortType,
                    })
                  );
                }
              : undefined,
        })
      )
      .catch(raise);
  }, [
    fields,
    baseTableName,
    fetchResults,
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
