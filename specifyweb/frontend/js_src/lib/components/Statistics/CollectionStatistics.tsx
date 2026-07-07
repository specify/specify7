/**
 * The Collection Statistics home page widget (issue #8185).
 *
 * Fetches collection statistics from the backend and displays them in a
 * sortable table inside an overlay dialog, handling the loading, empty and
 * error states. The dialog header shows the collection count and a Refresh
 * button re-fetches the data.
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { loadingGif } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { OverlayContext } from '../Router/Router';

export type CollectionStat = {
  readonly name: string;
  readonly specimenCount: number;
  readonly collectionType: string;
};

const endpoint = '/stats/collection/summary/';

export function CollectionStatisticsOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);

  // 'undefined' while the request is in flight and an array once it resolves.
  const [statistics, setStatistics] = React.useState<
    RA<CollectionStat> | undefined
  >(undefined);
  const [hasError, setHasError] = React.useState(false);
  // Incremented by the Refresh button to re-run the fetch.
  const [refreshCount, setRefreshCount] = React.useState(0);

  React.useEffect(() => {
    let destructorCalled = false;
    // Reset to the loading state (also re-triggered by the Refresh button).
    setStatistics(undefined);
    setHasError(false);
    ajax<RA<CollectionStat>>(endpoint, {
      headers: { Accept: 'application/json' },
      // Show the error inline in this dialog rather than the global dialog.
      errorMode: 'silent',
    })
      .then(({ data }) => {
        if (!destructorCalled) setStatistics(data);
      })
      .catch(() => {
        if (!destructorCalled) setHasError(true);
      });
    return (): void => {
      destructorCalled = true;
    };
  }, [refreshCount]);

  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    'collectionStatistics',
    'name'
  );
  const sorted =
    statistics === undefined
      ? undefined
      : applySortConfig(statistics, (row) => row[sortConfig.sortField]);

  const header =
    sorted === undefined
      ? statsText.collectionStatistics()
      : statsText.collectionStatisticsCount({ count: sorted.length });

  return (
    <Dialog
      buttons={
        <>
          <Button.Info
            onClick={(): void => setRefreshCount((count) => count + 1)}
          >
            {statsText.refresh()}
          </Button.Info>
          <span className="-ml-2 flex-1" />
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      header={header}
      onClose={handleClose}
    >
      {hasError ? (
        <ErrorMessage>{statsText.unableToLoadStatistics()}</ErrorMessage>
      ) : sorted === undefined ? (
        loadingGif
      ) : sorted.length === 0 ? (
        <p>{statsText.noCollectionStatistics()}</p>
      ) : (
        <table className="grid-table grid-cols-[1fr_auto_auto] gap-2">
          <thead>
            <tr>
              <th scope="col">
                <Button.LikeLink onClick={(): void => handleSort('name')}>
                  {statsText.collectionName()}
                  <SortIndicator fieldName="name" sortConfig={sortConfig} />
                </Button.LikeLink>
              </th>
              <th scope="col">
                <Button.LikeLink
                  onClick={(): void => handleSort('specimenCount')}
                >
                  {statsText.numberOfSpecimens()}
                  <SortIndicator
                    fieldName="specimenCount"
                    sortConfig={sortConfig}
                  />
                </Button.LikeLink>
              </th>
              <th scope="col">
                <Button.LikeLink
                  onClick={(): void => handleSort('collectionType')}
                >
                  {statsText.collectionType()}
                  <SortIndicator
                    fieldName="collectionType"
                    sortConfig={sortConfig}
                  />
                </Button.LikeLink>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((collection) => (
              <tr key={collection.name}>
                <td>{collection.name}</td>
                <td>{collection.specimenCount}</td>
                <td>{collection.collectionType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Dialog>
  );
}
