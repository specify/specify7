import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { loadingGif } from '../Molecules';
import { userPreferences } from '../Preferences/userPreferences';
import type { SelectedQuery } from './selection';
import type { QueryResultRow } from './Results';
import { queryIdField } from './Results';
import { useSelectedQueryResults } from './useSelectedQuery';

type FormResults =
  | {
      readonly selectedQuery: SelectedQuery;
      readonly selectedCount: number | undefined;
    }
  | {
      readonly selectedQuery?: undefined;
      readonly results: RA<QueryResultRow | undefined>;
      readonly selectedRows: ReadonlySet<number>;
      readonly totalCount: number | undefined;
      readonly onFetchMore:
        | ((index: number) => void | Promise<unknown>)
        | undefined;
    };

const noSelectedRows: ReadonlySet<number> = new Set();

export function SelectedQueryForms({
  table,
  title,
  inline = false,
  selectedIndex = 0,
  onSlide,
  onClose,
  onSaved,
  onDelete,
  ...source
}: FormResults & {
  readonly table: SpecifyTable;
  readonly title?: LocalizedString;
  readonly inline?: boolean;
  readonly selectedIndex?: number;
  readonly onSlide?: (index: number) => void;
  readonly onClose?: () => void;
  readonly onSaved?: () => void;
  readonly onDelete: (id: number) => void;
}): JSX.Element | null {
  const selectedQuery = source.selectedQuery;
  const selectedCount =
    source.selectedQuery !== undefined
      ? source.selectedCount
      : source.selectedRows.size > 0
        ? source.selectedRows.size
        : source.totalCount;
  const [isOpen, setIsOpen] = React.useState(false);
  const handleOpen =
    !inline && selectedCount !== undefined && selectedCount > 0
      ? (): void => setIsOpen(true)
      : undefined;
  const keyboardShortcut = userPreferences.useKeyboardShortcut(
    'queryBuilder',
    'actions',
    'browseInForms',
    handleOpen
  );
  const active = (inline || isOpen) && selectedCount !== 0;
  const {
    results: [queryResults],
    onFetchMore,
  } = useSelectedQueryResults(selectedQuery, active, selectedCount);
  const results =
    source.selectedQuery === undefined ? source.results : queryResults;
  const selectedRows =
    source.selectedQuery === undefined ? source.selectedRows : noSelectedRows;
  const fetchMore =
    source.selectedQuery === undefined
      ? source.selectedRows.size === 0
        ? source.onFetchMore
        : undefined
      : onFetchMore;
  const ids = React.useMemo(
    () =>
      getSelectedResults(results ?? [], selectedRows, active, selectedCount),
    [results, selectedRows, active, selectedCount]
  );
  const handleClose = (): void => {
    setIsOpen(false);
    onClose?.();
  };
  const selector =
    !active ||
    (source.selectedQuery !== undefined && selectedCount === undefined) ||
    (inline &&
      results !== undefined &&
      !hasFetchableRecordIds(results)) ? null : results === undefined ? (
      loadingGif
    ) : (
      <RecordSelectorFromIds
        canRemove={false}
        defaultIndex={selectedIndex}
        dialog={inline ? false : 'modal'}
        ids={ids}
        isDependent={false}
        isInRecordSet={false}
        newResource={undefined}
        table={table}
        title={
          title ??
          commonText.colonLine({
            label: queryText.queryResults(),
            value: table.label,
          })
        }
        totalCount={selectedCount}
        onAdd={undefined}
        onClone={undefined}
        onClose={handleClose}
        onDelete={(index): void => {
          const id = ids[index];
          if (id !== undefined) onDelete(id);
          else if (!inline) handleClose();
        }}
        onFetch={
          fetchMore === undefined
            ? undefined
            : async (index) => {
                if (ids[index] === undefined) await fetchMore(index);
                return undefined;
              }
        }
        onSaved={(): void => onSaved?.()}
        onSlide={(index): void => {
          onSlide?.(index);
          if (ids[index] === undefined) void fetchMore?.(index);
        }}
      />
    );
  return inline ? (
    selector === null ? null : (
      <div className="flex h-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto bg-[color:var(--form-background)]">
        {selector}
      </div>
    )
  ) : (
    <>
      <Button.Small
        disabled={selectedCount === undefined || selectedCount === 0}
        title={keyboardShortcut}
        onClick={handleOpen}
      >
        {queryText.browseInForms()}
      </Button.Small>
      {selector}
    </>
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
