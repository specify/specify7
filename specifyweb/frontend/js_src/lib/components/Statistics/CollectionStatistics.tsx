/**
 * The Collection Statistics home page widget (issue #8185).
 *
 * Fetches collection statistics from the backend and displays them in a table
 * inside an overlay dialog, handling the loading, empty and error states.
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

  React.useEffect(() => {
    let destructorCalled = false;
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
  }, []);

  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={statsText.collectionStatistics()}
      onClose={handleClose}
    >
      {hasError ? (
        <ErrorMessage>{statsText.unableToLoadStatistics()}</ErrorMessage>
      ) : statistics === undefined ? (
        loadingGif
      ) : statistics.length === 0 ? (
        <p>{statsText.noCollectionStatistics()}</p>
      ) : (
        <table className="grid-table grid-cols-[1fr_auto_auto] gap-2">
          <thead>
            <tr>
              <th scope="col">{statsText.collectionName()}</th>
              <th scope="col">{statsText.numberOfSpecimens()}</th>
              <th scope="col">{statsText.collectionType()}</th>
            </tr>
          </thead>
          <tbody>
            {statistics.map((collection) => (
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
