import React from 'react';

import { f } from '../../utils/functools';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { useBooleanState } from '../../hooks/hooks';
import { queryIdField } from './ResultsTable';
import { RecordSelectorFromIds } from '../Forms/RecordSelectorUtils';

export function QueryToForms({
  model,
  results,
  selectedRows,
  onFetchMore: handleFetchMore,
  onDelete: handleDelete,
  totalCount,
}: {
  readonly model: SpecifyModel;
  readonly results: RA<RA<number | string | null> | undefined>;
  readonly selectedRows: ReadonlySet<number>;
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
        disabled={results.length === 0 || totalCount === undefined}
        onClick={handleOpen}
      >
        {commonText('browseInForms')}
      </Button.Small>
      {isOpen && typeof totalCount === 'number' ? (
        <RecordSelectorFromIds
          canAddAnother={false}
          canRemove={false}
          defaultIndex={0}
          dialog="modal"
          ids={ids}
          isDependent={false}
          mode="edit"
          model={model}
          newResource={undefined}
          title={queryText('queryResults', model.label)}
          totalCount={selectedRows.size === 0 ? totalCount : selectedRows.size}
          urlContext={false}
          onAdd={undefined}
          onClose={handleClose}
          onDelete={(index): void => handleDelete(unParseIndex(index))}
          onSaved={f.void}
          onSlide={(index): void =>
            selectedRows.size === 0 && results[index] === undefined
              ? handleFetchMore?.(index)
              : undefined
          }
        />
      ) : undefined}
    </>
  );
}

export function useSelectedResults(
  results: RA<RA<number | string | null> | undefined>,
  selectedRows: ReadonlySet<number>,
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
