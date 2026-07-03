import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { collectionStatsText } from '../../localization/collectionStats';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import { localized, type RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { formatNumber } from '../Atoms/Internationalization';
import { loadingBar } from '../Molecules';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import type { SortConfig } from '../Molecules/Sorting';
import { SortIndicator } from '../Molecules/Sorting';

export type CollectionStat = {
  readonly name: string;
  readonly specimenCount: number;
  readonly collectionType: string;
};

type SortField = keyof CollectionStat;

const statsEndpoint = '/context/collection_stats.json';

/**
 * Button component that opens the Collection Statistics dialog
 */
export function CollectionStatisticsButton(): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Info onClick={handleOpen}>
        {collectionStatsText.collectionStatistics()}
      </Button.Info>
      {isOpen && <CollectionStatistics onClose={handleClose} />}
    </>
  );
}

/**
 * handleFetch:   Fetches collection statistics from the backend
 * stats:         The fetch state tracked for loading, empty and error states
 * sortConfig:    The column and direction used for client side sorting
 */
function CollectionStatistics({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  const [stats, setStats] = React.useState<
    'error' | 'loading' | RA<CollectionStat>
  >('loading');

  const handleFetch = React.useCallback(() => {
    setStats('loading');
    ajax<RA<CollectionStat>>(statsEndpoint, {
      headers: { Accept: 'application/json' },
      // Handle the error inline instead of letting ajax show its own dialog
      errorMode: 'silent',
    })
      .then(({ data }) => setStats(Array.isArray(data) ? data : 'error'))
      .catch(() => setStats('error'));
  }, []);

  React.useEffect(() => handleFetch(), [handleFetch]);

  const [sortConfig, setSortConfig] = React.useState<SortConfig<SortField>>({
    sortField: 'name',
    ascending: true,
  });
  const handleSort = (sortField: SortField): void =>
    setSortConfig((old) => ({
      sortField,
      ascending: sortField === old.sortField ? !old.ascending : true,
    }));

  const rows = React.useMemo(
    () =>
      Array.isArray(stats)
        ? Array.from(stats).sort(
          sortFunction(
            (row) => row[sortConfig.sortField],
            !sortConfig.ascending
          )
        )
        : [],
    [stats, sortConfig]
  );

  // Loading Dialog
  if (stats === 'loading')
    return (
      <Dialog
        buttons={undefined}
        className={{ container: dialogClassNames.narrowContainer }}
        header={commonText.loading()}
        onClose={undefined}
      >
        {loadingBar}
      </Dialog>
    );

  const header = Array.isArray(stats)
    ? localized(
      `${collectionStatsText.collectionStatistics()} (${formatNumber(
        stats.length
      )})`
    )
    : collectionStatsText.collectionStatistics();

  return (
    <Dialog
      buttons={
        <>
          <Button.Info onClick={handleFetch}>
            {collectionStatsText.refresh()}
          </Button.Info>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      header={header}
      onClose={handleClose}
    >
      {stats === 'error' ? (
        <p>{collectionStatsText.unableToLoad()}</p>
      ) : stats.length === 0 ? (
        <p>{collectionStatsText.noStatistics()}</p>
      ) : (
        <table className="grid-table grid-cols-[auto_auto_auto] gap-x-4 gap-y-1">
          {/* Table Header */}
          <thead>
            <tr>
              <th scope="col">
                <Button.LikeLink onClick={() => handleSort('name')}>
                  {collectionStatsText.collectionName()}
                  <SortIndicator fieldName="name" sortConfig={sortConfig} />
                </Button.LikeLink>
              </th>
              <th scope="col">
                <Button.LikeLink onClick={() => handleSort('specimenCount')}>
                  {collectionStatsText.numberOfSpecimens()}
                  <SortIndicator
                    fieldName="specimenCount"
                    sortConfig={sortConfig}
                  />
                </Button.LikeLink>
              </th>
              <th scope="col">
                <Button.LikeLink onClick={() => handleSort('collectionType')}>
                  {collectionStatsText.collectionType()}
                  <SortIndicator
                    fieldName="collectionType"
                    sortConfig={sortConfig}
                  />
                </Button.LikeLink>
              </th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.name}</td>
                <td className="tabular-nums">
                  {formatNumber(row.specimenCount)}
                </td>
                <td>{row.collectionType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Dialog>
  );
}
