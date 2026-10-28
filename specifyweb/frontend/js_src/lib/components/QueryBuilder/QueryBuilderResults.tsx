import React from 'react';

import { type RA, localized } from '../../utils/types';
import { BatchEditFromQuery } from '../BatchEdit';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { RecordSet, SpQuery, SpQueryField } from '../DataModel/types';
import { hasPermission } from '../Permissions/helpers';
import { datasetVariants } from '../WbUtils/datasetVariants';
import { MakeRecordSetButton } from './Components';
import { QueryExportButtons } from './Export';
import type { QueryField } from './helpers';
import type { MainState } from './reducer';
import type { QueryResultRow } from './Results';
import { QueryResultsWrapper } from './ResultsWrapper';
import { emptySelection, type QuerySelection } from './selection';
import { SelectedQueryForms } from './SelectedQueryForms';
import { parseQueryFields } from './helpers';
import { getTableById } from '../DataModel/tables';

export function QueryBuilderResults({
  table,
  enableBulkSelection,
  query,
  queryResource,
  recordSet,
  forceCollection,
  state,
  isReadOnly,
  saveRequired,
  isCountOnly,
  getQueryFieldRecords,
  selectedRows,
  setSelectedRows,
  selectedIndex,
  setSelectedIndex,
  resultsRef,
  isSplit,
  isHorizontal,
  maximumPrimaryPaneWidth,
  splitViewRef,
  onReRun: handleReRun,
  onResults: handleResults,
  onSelected: handleSelected,
  onSortChange: handleSortChange,
}: {
  readonly table: SpecifyTable;
  readonly enableBulkSelection: boolean;
  readonly query: SerializedResource<SpQuery>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly recordSet: SpecifyResource<RecordSet> | undefined;
  readonly forceCollection: number | undefined;
  readonly state: MainState;
  readonly isReadOnly: boolean;
  readonly saveRequired: boolean;
  readonly isCountOnly: boolean;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
  readonly selectedRows: ReadonlySet<number>;
  readonly setSelectedRows: React.Dispatch<
    React.SetStateAction<ReadonlySet<number>>
  >;
  readonly selectedIndex: number;
  readonly setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly resultsRef: React.MutableRefObject<
    RA<QueryResultRow | undefined> | undefined
  >;
  readonly isSplit: boolean;
  readonly isHorizontal: boolean;
  readonly maximumPrimaryPaneWidth: number;
  readonly splitViewRef: React.RefCallback<HTMLDivElement>;
  readonly onReRun: () => void;
  readonly onResults?: (results: RA<QueryResultRow | undefined>) => void;
  readonly onSelected: (ids: RA<number>) => void;
  readonly onSortChange: (fields: RA<QueryField>) => void;
}): JSX.Element | null {
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [selection, setSelection] =
    React.useState<QuerySelection>(emptySelection);
  const explicitSelection = enableBulkSelection;
  React.useEffect(() => setSelectedIndex(0), [selection, setSelectedIndex]);
  return hasPermission('/querybuilder/query', 'execute') ? (
    <QueryResultsWrapper
      showSelectionControls={enableBulkSelection}
      selection={explicitSelection ? [selection, setSelection] : undefined}
      renderActions={
        explicitSelection
          ? (executedQuery) =>
              executedQuery.selectDistinct ||
              executedQuery.smushed ||
              executedQuery.countOnly
                ? undefined
                : {
                    createRecordSet:
                      !isReadOnly &&
                      hasPermission(
                        '/querybuilder/query',
                        'create_recordset'
                      ) ? (
                        <MakeRecordSetButton
                          baseTableName={
                            getTableById(executedQuery.contextTableId).name
                          }
                          fields={parseQueryFields(executedQuery.fields)}
                          getQueryFieldRecords={undefined}
                          queryResource={queryResource}
                          sourceRecordSetId={recordSet?.id}
                          selectedQuery={{ query: executedQuery, selection }}
                        />
                      ) : undefined,
                    extraButtons: (
                      <>
                        {datasetVariants.batchEdit.canCreate() && (
                          <BatchEditFromQuery
                            baseTableName={
                              getTableById(executedQuery.contextTableId).name
                            }
                            fields={parseQueryFields(executedQuery.fields)}
                            query={queryResource}
                            recordSetId={recordSet?.id}
                            saveRequired={saveRequired}
                          />
                        )}
                        {!isCountOnly && (
                          <QueryExportButtons
                            baseTableName={
                              getTableById(executedQuery.contextTableId).name
                            }
                            fields={parseQueryFields(executedQuery.fields)}
                            getQueryFieldRecords={undefined}
                            queryResource={queryResource}
                            recordSetId={recordSet?.id}
                            results={resultsRef}
                            selectedRows={selectedRows}
                            selectedQuery={{ query: executedQuery, selection }}
                          />
                        )}
                      </>
                    ),
                  }
          : undefined
      }
      createRecordSet={
        !isReadOnly &&
        hasPermission('/querybuilder/query', 'create_recordset') &&
        !queryResource.get('selectDistinct') ? (
          <MakeRecordSetButton
            baseTableName={state.baseTableName}
            fields={state.fields}
            getQueryFieldRecords={getQueryFieldRecords}
            queryResource={queryResource}
            sourceRecordSetId={recordSet?.id}
          />
        ) : undefined
      }
      extraButtons={
        <>
          {datasetVariants.batchEdit.canCreate() && (
            <BatchEditFromQuery
              baseTableName={state.baseTableName}
              fields={state.fields}
              query={queryResource}
              recordSetId={recordSet?.id}
              saveRequired={saveRequired}
            />
          )}
          {isCountOnly ? undefined : (
            <QueryExportButtons
              baseTableName={state.baseTableName}
              fields={state.fields}
              getQueryFieldRecords={getQueryFieldRecords}
              queryResource={queryResource}
              recordSetId={recordSet?.id}
              results={resultsRef}
              selectedRows={selectedRows}
            />
          )}
        </>
      }
      fields={state.fields}
      forceCollection={forceCollection}
      countOnly={isCountOnly}
      queryResource={queryResource}
      queryRunCount={state.queryRunCount}
      refreshToken={refreshToken}
      recordSetId={recordSet?.id}
      resultsRef={resultsRef}
      selectedRows={[selectedRows, setSelectedRows]}
      isSplit={isSplit}
      splitContainerRef={splitViewRef}
      splitHorizontal={isHorizontal}
      splitPrimaryPaneMaxWidth={`${maximumPrimaryPaneWidth}px`}
      renderSplitPane={({
        results,
        selectedRows: resultSelection,
        totalCount,
        onFetchMore,
        onDelete,
        selectedQuery,
        selectedCount,
      }) => (
        <>
          {!isCountOnly &&
          (selectedQuery !== undefined || query.selectDistinct !== true) ? (
            <SelectedQueryForms
              inline
              {...(selectedQuery === undefined
                ? {
                    results,
                    selectedRows: resultSelection,
                    totalCount,
                    onFetchMore,
                  }
                : { selectedQuery, selectedCount })}
              selectedIndex={selectedIndex}
              table={
                selectedQuery === undefined
                  ? table
                  : getTableById(selectedQuery.query.contextTableId)
              }
              title={localized(query.name)}
              onSlide={setSelectedIndex}
              onClose={(): void => {
                setSelectedRows(new Set());
                if (explicitSelection) setSelection(emptySelection());
                setSelectedIndex(0);
              }}
              onDelete={onDelete}
              onSaved={(): void => setRefreshToken((token) => token + 1)}
            />
          ) : null}
        </>
      )}
      table={table}
      onReRun={handleReRun}
      onResults={handleResults}
      onSelected={handleSelected}
      onSortChange={handleSortChange}
    />
  ) : null;
}
