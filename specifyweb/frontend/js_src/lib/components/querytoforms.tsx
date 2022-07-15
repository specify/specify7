import React from 'react';

import { f } from '../functools';
import { commonText } from '../localization/common';
import { queryText } from '../localization/query';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { Button } from './basic';
import { useBooleanState } from './hooks';
import { queryIdField } from './queryresultstable';
import { RecordSelectorFromIds } from './recordselectorutils';

export function QueryToForms({
  model,
  results,
  selectedRows,
  onFetchMore: handleFetchMore,
  onDelete: handleDelete,
  totalCount,
}: {
  readonly model: SpecifyModel;
  readonly results: RA<RA<string | number | null> | undefined>;
  readonly selectedRows: Set<number>;
  readonly onFetchMore: ((index: number) => void) | undefined;
  readonly onDelete: (index: number) => void;
  readonly totalCount: number | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const ids = useSelectedResults(results, selectedRows, isOpen);

  const unParseIndex = (index: number): number =>
    selectedRows.size === 0
      ? index
      : f.var(Array.from(selectedRows)[index], (deletedRecordId) =>
          results.findIndex((row) => row![queryIdField] === deletedRecordId)
        );

  return (
    <>
      <Button.Small
        onClick={handleOpen}
        disabled={results.length === 0 || totalCount === undefined}
      >
        {commonText('browseInForms')}
      </Button.Small>
      {isOpen && typeof totalCount === 'number' ? (
        <RecordSelectorFromIds
          totalCount={selectedRows.size === 0 ? totalCount : selectedRows.size}
          ids={ids}
          newResource={undefined}
          defaultIndex={0}
          model={model}
          onAdd={undefined}
          onDelete={(index): void => handleDelete(unParseIndex(index))}
          onSlide={(index): void =>
            selectedRows.size === 0 && results[index] === undefined
              ? handleFetchMore?.(index)
              : undefined
          }
          dialog="modal"
          onClose={handleClose}
          onSaved={f.void}
          isDependent={false}
          title={queryText('queryResults', model.label)}
          mode="edit"
          canAddAnother={false}
          canRemove={false}
          urlContext={false}
        />
      ) : undefined}
    </>
  );
}

export function useSelectedResults(
  results: RA<RA<string | number | null> | undefined>,
  selectedRows: Set<number>,
  isOpen: boolean
): RA<number | undefined> {
  const [ids, setIds] = React.useState<RA<number>>([]);
  React.useEffect(
    () =>
      isOpen
        ? setIds(
            selectedRows.size === 0
              ? (results.map((row) => row?.[queryIdField]) as RA<number>)
              : Array.from(selectedRows)
          )
        : undefined,
    [results, isOpen, selectedRows]
  );
  return ids;
}
