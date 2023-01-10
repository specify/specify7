import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import type { QueryResultRow } from './Results';
import { queryIdField } from './Results';

export function QueryToForms({
  model,
  results,
  selectedRows,
  onFetchMore: handleFetchMore,
  onDelete: handleDelete,
  totalCount,
}: {
  readonly model: SpecifyModel;
  readonly results: RA<QueryResultRow | undefined>;
  readonly selectedRows: ReadonlySet<number>;
  readonly onFetchMore: ((index: number) => void) | undefined;
  readonly onDelete: (index: number) => void;
  readonly totalCount: number | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const ids = useSelectedResults(results, selectedRows, isOpen);

  function unParseIndex(index: number): number {
    if (selectedRows.size === 0) return index;
    const deletedRecordId = Array.from(selectedRows)[index];
    return results.findIndex((row) => row![queryIdField] === deletedRecordId);
  }

  return (
    <>
      <Button.Small
        disabled={results.length === 0 || totalCount === undefined}
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
          mode="edit"
          model={model}
          newResource={undefined}
          title={commonText.colonLine({
            label: queryText.queryResults(),
            value: model.label,
          })}
          totalCount={selectedRows.size === 0 ? totalCount : selectedRows.size}
          onAdd={undefined}
          onClone={undefined}
          onClose={handleClose}
          onDelete={(index): void => handleDelete(unParseIndex(index))}
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

function useSelectedResults(
  results: RA<QueryResultRow | undefined>,
  selectedRows: ReadonlySet<number>,
  isOpen: boolean
): RA<number | undefined> {
  return React.useMemo(
    () =>
      isOpen
        ? selectedRows.size === 0
          ? (results.map((row) => row?.[queryIdField]) as RA<number>)
          : Array.from(selectedRows)
        : [],
    [results, isOpen, selectedRows]
  );
}
