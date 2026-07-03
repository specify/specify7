import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { collectionStatsText } from '../../localization/collectionStats';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { formatNumber } from '../Atoms/Internationalization';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';

export type CollectionStat = {
  readonly name: string;
  readonly specimenCount: number;
  readonly collectionType: string;
};

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

  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={collectionStatsText.collectionStatistics()}
      onClose={handleClose}
    >
      {stats === 'loading' ? (
        loadingBar
      ) : stats === 'error' ? (
        <p>{collectionStatsText.unableToLoad()}</p>
      ) : stats.length === 0 ? (
        <p>{collectionStatsText.noStatistics()}</p>
      ) : (
        <table className="grid-table grid-cols-[auto_auto_auto] gap-x-4 gap-y-1">
          <thead>
            <tr>
              <th scope="col">{collectionStatsText.collectionName()}</th>
              <th scope="col">{collectionStatsText.numberOfSpecimens()}</th>
              <th scope="col">{collectionStatsText.collectionType()}</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row, index) => (
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
