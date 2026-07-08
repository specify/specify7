import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { welcomeText } from '../../localization/welcome';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';

type CollectionStatistic = {
  readonly name: string;
  readonly specimenCount: number;
  readonly collectionType: string;
};

type FetchResult =
  | { readonly type: 'error' }
  | { readonly type: 'data'; readonly statistics: RA<CollectionStatistic> };

export function CollectionStatistics({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  const [result] = useAsyncState<FetchResult>(
    React.useCallback(
      async () =>
        ajax<RA<CollectionStatistic>>('/stats/collection/statistics/', {
          headers: { Accept: 'application/json' },
          errorMode: 'silent',
        })
          .then(({ data }) => ({ type: 'data', statistics: data }) as const)
          // Assumption: any failure (non-2xx, network error, bad JSON) is
          // treated identically as a generic error state, per the issue's
          // "non-2xx response, network error, or malformed response" wording
          // — we don't distinguish between these cases in the UI.
          .catch(() => ({ type: 'error' }) as const),
      []
    ),
    false
  );

  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    'collectionStatistics',
    'name'
  );

  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      className={{
        container: dialogClassNames.normalContainer,
        content: dialogClassNames.flexContent,
      }}
      header={welcomeText.collectionStatistics()}
      onClose={handleClose}
    >
      {result === undefined ? (
        commonText.loading()
      ) : result.type === 'error' ? (
        welcomeText.unableToLoadStatistics()
      ) : result.statistics.length === 0 ? (
        welcomeText.noStatisticsAvailable()
      ) : (
        <table className="grid-table grid-cols-[auto,auto,auto] gap-2">
          <thead>
            <tr>
              <th scope="col">
                <Button.LikeLink onClick={() => handleSort('name')}>
                  {welcomeText.collectionName()}
                </Button.LikeLink>
                <SortIndicator fieldName="name" sortConfig={sortConfig} />
              </th>
              <th scope="col">
                <Button.LikeLink onClick={() => handleSort('specimenCount')}>
                  {welcomeText.numberOfSpecimens()}
                </Button.LikeLink>
                <SortIndicator
                  fieldName="specimenCount"
                  sortConfig={sortConfig}
                />
              </th>
              <th scope="col">
                <Button.LikeLink onClick={() => handleSort('collectionType')}>
                  {welcomeText.collectionTypeHeader()}
                </Button.LikeLink>
                <SortIndicator
                  fieldName="collectionType"
                  sortConfig={sortConfig}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {applySortConfig(
              result.statistics,
              (item) => item[sortConfig.sortField]
            ).map(({ name, specimenCount, collectionType }, index) => (
              <tr key={index}>
                <td>{name}</td>
                <td>{specimenCount}</td>
                <td>{collectionType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Dialog>
  );
}
