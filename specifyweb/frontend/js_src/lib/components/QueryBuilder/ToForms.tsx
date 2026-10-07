import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import type { QueryResultRow } from './Results';
import { queryIdField } from './Results';

export function QueryToForms({
  table,
  results,
  selectedRows,
  onFetchMore: handleFetchMore,
  onDelete: handleDelete,
  totalCount,
}: {
  readonly table: SpecifyTable;
  readonly results: RA<QueryResultRow | undefined>;
  readonly selectedRows: ReadonlySet<number>;
  readonly onFetchMore: ((index: number) => void) | undefined;
  readonly onDelete: (id: number) => void;
  readonly totalCount: number | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const ids = useSelectedResults(results, selectedRows, isOpen, totalCount);

  const unParseIndex = (index: number): number =>
    selectedRows.size === 0
      ? (results[index]![queryIdField] as number)
      : Array.from(selectedRows)[index];

  return (
    <>
      <Button.Small
        disabled={totalCount === undefined || totalCount === 0}
        onClick={handleOpen}
      >
        {queryText.browseInForms()}
      </Button.Small>
      {isOpen && typeof totalCount === 'number' ? (
        <RecordSelectorFromIds
          canRemove={false}
          defaultIndex={0}
          dialog="modal"
          ids={ids}
          isDependent={false}
          isInRecordSet={false}
          newResource={undefined}
          table={table}
          title={commonText.colonLine({
            label: queryText.queryResults(),
            value: table.label,
          })}
          totalCount={selectedRows.size === 0 ? totalCount : selectedRows.size}
          onAdd={undefined}
          onClone={undefined}
          onClose={handleClose}
          onDelete={(index): void => {
            if (
              (selectedRows.size === 0 && results[index] === undefined) ||
              (selectedRows.size > 0 &&
                Array.from(selectedRows)[index] === undefined)
            ) {
              handleClose();
            } else {
              handleDelete(unParseIndex(index));
            }
          }}
          onFetch={
            handleFetchMore
              ? async (index) => {
                  handleFetchMore(index);
                  return undefined;
                }
              : undefined
          }
          onSaved={f.void}
          onSlide={
            typeof handleFetchMore === 'function'
              ? (index): void =>
                  selectedRows.size === 0 && results[index] === undefined
                    ? handleFetchMore?.(index)
                    : undefined
              : undefined
          }
        />
      ) : undefined}
    </>
  );
}

export function QueryFormView({
  suspended = false,
  table,
  title,
  results,
  selectedRows,
  selectedIndex,
  totalCount,
  onFetchMore: handleFetchMore,
  onDelete: handleDelete,
  onClose: handleClose,
  onSaved: handleSaved,
  onSlide: handleSlide,
}: {
  // Merge tasks can delete previewed records before query results are refreshed.
  readonly suspended?: boolean;
  readonly table: SpecifyTable;
  readonly title: LocalizedString;
  readonly results: RA<QueryResultRow | undefined>;
  readonly selectedRows: ReadonlySet<number>;
  readonly selectedIndex: number;
  readonly totalCount: number | undefined;
  readonly onFetchMore:
    | ((index?: number) => Promise<RA<QueryResultRow | undefined> | undefined>)
    | undefined;
  readonly onDelete: (id: number) => void;
  readonly onClose: () => void;
  readonly onSaved: () => void;
  readonly onSlide: (index: number) => void;
}): JSX.Element | null {
  const ids = useSelectedResults(results, selectedRows, true, totalCount);
  if (suspended || !hasFetchableRecordIds(results) || ids.length === 0)
    return null;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto bg-[color:var(--form-background)]">
      <RecordSelectorFromIds
        canRemove={false}
        defaultIndex={selectedIndex}
        dialog={false}
        ids={ids}
        isDependent={false}
        isInRecordSet={false}
        newResource={undefined}
        table={table}
        title={title}
        totalCount={selectedRows.size === 0 ? totalCount : selectedRows.size}
        onAdd={undefined}
        onClone={undefined}
        onClose={handleClose}
        onDelete={(index): void => {
          const id =
            selectedRows.size === 0
              ? results[index]?.[queryIdField]
              : Array.from(selectedRows)[index];
          if (typeof id === 'number') handleDelete(id);
        }}
        onFetch={
          handleFetchMore === undefined
            ? undefined
            : async (index) => {
                await handleFetchMore(index);
                return undefined;
              }
        }
        onSaved={handleSaved}
        onSlide={(index): void => {
          handleSlide(index);
          if (selectedRows.size === 0 && results[index] === undefined)
            void handleFetchMore?.(index);
        }}
      />
    </div>
  );
}

export function getSelectedResults(
  results: RA<QueryResultRow | undefined>,
  selectedRows: ReadonlySet<number>,
  isOpen: boolean,
  totalCount: number | undefined
): RA<number | undefined> {
  if (!isOpen) return [];
  if (selectedRows.size > 0) return Array.from(selectedRows);

  const ids = results.map((row) => row?.[queryIdField] as number | undefined);
  if (totalCount !== undefined) ids.length = Math.max(ids.length, totalCount);
  return ids;
}

export function hasFetchableRecordIds(
  results: RA<QueryResultRow | undefined>
): boolean {
  return results.some((row) => {
    const id = row?.[queryIdField];
    return typeof id === 'number' && Number.isFinite(id);
  });
}

function useSelectedResults(
  results: RA<QueryResultRow | undefined>,
  selectedRows: ReadonlySet<number>,
  isOpen: boolean,
  totalCount: number | undefined
): RA<number | undefined> {
  return React.useMemo(
    () => getSelectedResults(results, selectedRows, isOpen, totalCount),
    [results, isOpen, selectedRows, totalCount]
  );
}
