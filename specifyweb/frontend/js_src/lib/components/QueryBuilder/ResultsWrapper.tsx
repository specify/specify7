import React from 'react';

import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpQuery, Tables } from '../DataModel/types';
import { fail } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { loadingGif } from '../Molecules';
import type { QueryField } from './helpers';
import {
  addAuditLogFields,
  queryFieldsToFieldSpecs,
  unParseQueryFields,
} from './helpers';
import { QueryResults } from './Results';

// TODO: [FEATURE] allow customizing this and other constants as make sense
const fetchSize = 40;

export function QueryResultsWrapper({
  baseTableName,
  model,
  queryRunCount,
  queryResource,
  fields,
  recordSetId,
  createRecordSet,
  extraButtons,
  forceCollection,
  onSelected: handleSelected,
  onSortChange: handleSortChange,
}: {
  readonly baseTableName: keyof Tables;
  readonly model: SpecifyModel;
  readonly queryRunCount: number;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly recordSetId: number | undefined;
  readonly createRecordSet: JSX.Element | undefined;
  readonly extraButtons: JSX.Element;
  readonly forceCollection: number | undefined;
  readonly onSelected?: (selected: RA<number>) => void;
  readonly onSortChange?: (
    fieldIndex: number,
    direction: 'ascending' | 'descending' | undefined
  ) => void;
}): JSX.Element | null {
  const fetchResults = React.useCallback(
    async (offset: number) =>
      ajax<{ readonly results: RA<RA<number | string | null>> }>(
        '/stored_query/ephemeral/',
        {
          method: 'POST',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
          body: keysToLowerCase({
            ...queryResource.toJSON(),
            fields: unParseQueryFields(
              baseTableName,
              addAuditLogFields(baseTableName, fields)
            ),
            collectionId: forceCollection,
            recordSetId,
            limit: fetchSize,
            offset,
          }),
        }
      ).then(({ data }) => data.results),
    [forceCollection, fields, baseTableName, queryResource, recordSetId]
  );

  /*
   * Need to store all props in a state so that query field edits do not affect
   * the query results until query is reRun
   */
  const [props, setProps] = React.useState<
    Omit<Parameters<typeof QueryResults>[0], 'totalCount'> | undefined
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

    const allFields = addAuditLogFields(baseTableName, fields);

    setTotalCount(undefined);
    ajax<{ readonly count: number }>('/stored_query/ephemeral/', {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
      body: keysToLowerCase({
        ...queryResource.toJSON(),
        collectionId: forceCollection,
        fields: unParseQueryFields(baseTableName, allFields),
        recordSetId,
        countOnly: true,
      }),
    })
      .then(({ data }) => setTotalCount(data.count))
      .catch(fail);

    const displayedFields = allFields.filter((field) => field.isDisplay);
    const initialData =
      // Run as count only if there are no visible fields
      queryResource.get('countOnly') === true || displayedFields.length === 0
        ? Promise.resolve(undefined)
        : fetchResults(0);
    const fieldSpecs = queryFieldsToFieldSpecs(
      baseTableName,
      displayedFields
    ).map(([_field, fieldSpec]) => fieldSpec);

    initialData
      .then((initialData) =>
        setProps({
          model,
          hasIdField: queryResource.get('selectDistinct') !== true,
          fetchSize,
          fetchResults,
          fieldSpecs,
          initialData,
          sortConfig: fields
            .filter(({ isDisplay }) => isDisplay)
            .map((field) => field.sortType),
          onSortChange:
            typeof handleSortChange === 'function'
              ? (fieldSpec, direction) => {
                  /*
                   * If some fields are not displayed, visual index and actual field
                   * index differ
                   */
                  const index = fieldSpecs.indexOf(fieldSpec);
                  const field = displayedFields[index];
                  const originalIndex = allFields.indexOf(field);
                  handleSortChange(originalIndex, direction);
                }
              : undefined,
          createRecordSet,
          extraButtons,
          onSelected: handleSelected,
        })
      )
      .catch(fail);
  }, [
    fields,
    baseTableName,
    fetchResults,
    forceCollection,
    queryResource,
    queryRunCount,
    recordSetId,
    model,
  ]);

  return props === undefined ? (
    queryRunCount === 0 ? null : (
      <div className="flex-1 snap-start">{loadingGif}</div>
    )
  ) : (
    <div
      className={`
        flex flex-1 snap-start
        ${typeof handleSelected === 'function' ? 'max-h-[70vh]' : ''}
      `}
    >
      <ErrorBoundary dismissable>
        <QueryResults {...props} totalCount={totalCount} />
      </ErrorBoundary>
    </div>
  );
}
