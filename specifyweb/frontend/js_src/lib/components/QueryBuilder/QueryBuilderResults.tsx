import React from 'react';

import { commonText } from '../../localization/common';
import { localized, type RA } from '../../utils/types';
import { BatchEditFromQuery } from '../BatchEdit';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { RecordSet, SpQuery, SpQueryField } from '../DataModel/types';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { hasPermission } from '../Permissions/helpers';
import { datasetVariants } from '../WbUtils/datasetVariants';
import { MakeRecordSetButton } from './Components';
import { QueryExportButtons } from './Export';
import type { QueryField } from './helpers';
import type { MainState } from './reducer';
import type { QueryResultRow } from './Results';
import { QueryResultsWrapper } from './ResultsWrapper';

export function QueryBuilderResults({
  table,
  query,
  queryResource,
  recordSet,
  forceCollection,
  state,
  isReadOnly,
  saveRequired,
  getQueryFieldRecords,
  selectedRows,
  setSelectedRows,
  selectedIndex,
  setSelectedIndex,
  resultsRef,
  isSplit,
  isHorizontal,
  splitterKey,
  onReRun: handleReRun,
  onRunQuery: handleRunQuery,
  onSelected: handleSelected,
  onSortChange: handleSortChange,
}: {
  readonly table: SpecifyTable;
  readonly query: SerializedResource<SpQuery>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly recordSet: SpecifyResource<RecordSet> | undefined;
  readonly forceCollection: number | undefined;
  readonly state: MainState;
  readonly isReadOnly: boolean;
  readonly saveRequired: boolean;
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
  readonly splitterKey: number;
  readonly onReRun: () => void;
  readonly onRunQuery: (fields?: RA<QueryField>) => void;
  readonly onSelected: (ids: RA<number>) => void;
  readonly onSortChange: (fields: RA<QueryField>) => void;
}): JSX.Element | null {
  const selectedIds = React.useMemo(
    () => Array.from(selectedRows),
    [selectedRows]
  );
  const recordPreview = (
    <div className="flex h-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto bg-[color:var(--form-background)]">
      {selectedIds.length === 0 ? (
        <p className="m-auto text-neutral-500">{commonText.select()}</p>
      ) : (
        <RecordSelectorFromIds
          canRemove={false}
          defaultIndex={selectedIndex}
          dialog={false}
          ids={selectedIds}
          isDependent={false}
          isInRecordSet={false}
          newResource={undefined}
          table={table}
          title={localized(query.name)}
          totalCount={selectedIds.length}
          onAdd={undefined}
          onClone={undefined}
          onClose={(): void => {
            setSelectedRows(new Set());
            setSelectedIndex(0);
          }}
          onDelete={undefined}
          onSaved={(): void => handleRunQuery()}
          onSlide={setSelectedIndex}
        />
      )}
    </div>
  );

  return hasPermission('/querybuilder/query', 'execute') ? (
    <QueryResultsWrapper
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
          {query.countOnly ? undefined : (
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
      queryResource={queryResource}
      queryRunCount={state.queryRunCount}
      recordSetId={recordSet?.id}
      resultsRef={resultsRef}
      selectedRows={[selectedRows, setSelectedRows]}
      splitterKey={splitterKey}
      splitHorizontal={isHorizontal}
      splitPane={isSplit ? recordPreview : undefined}
      table={table}
      onReRun={handleReRun}
      onSelected={handleSelected}
      onSortChange={handleSortChange}
    />
  ) : null;
}
