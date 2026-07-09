import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { collectionStatisticsText } from '../../localization/collectionStatistics';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { loadingGif } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import type { SortConfig } from '../Molecules/Sorting';
import { SortIndicator } from '../Molecules/Sorting';

/** The shape returned by the /context/collection_stats.json endpoint. */
export type CollectionStat = {
  readonly name: string;
  readonly specimenCount: number;
  readonly collectionType: string;
};

/**
 * Explicit fetch state so the dialog can render distinct loading, error,
 * empty, and loaded UIs. The default useAsyncState convention returns
 * undefined while loading and pops a global crash dialog on error, which
 * cannot show an inline "try again" message.
 */
type FetchState =
  | { readonly type: 'error' }
  | { readonly type: 'loaded'; readonly data: RA<CollectionStat> }
  | { readonly type: 'loading' };

const statsUrl = '/context/collection_stats.json';

type SortField = keyof CollectionStat;

/**
 * Home page widget: a "Collection Statistics" button that opens a dialog
 * showing collection statistics from the back-end.
 *
 * Assumption: the issue asks for a button "on the home page", so this widget
 * sits inline in the WelcomeView body. The idiomatic alternative — a Header
 * menu item pointing to an overlay route — would also work; the <Dialog>
 * itself follows the standard convention either way.
 */
export function CollectionStatistics(): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Info onClick={handleOpen}>
        {collectionStatisticsText.collectionStatistics()}
      </Button.Info>
      {isOpen && <CollectionStatisticsDialog onClose={handleClose} />}
    </>
  );
}

function CollectionStatisticsDialog({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<FetchState>({ type: 'loading' });
  const [sortConfig, setSortConfig] = React.useState<SortConfig<SortField>>({
    sortField: 'name',
    ascending: true,
  });

  const fetchStats = React.useCallback((): void => {
    setState({ type: 'loading' });
    ajax<RA<CollectionStat>>(statsUrl, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
      // Handle errors inline in the dialog instead of the global error dialog.
      errorMode: 'silent',
    })
      .then(({ data }) =>
        setState(
          Array.isArray(data) ? { type: 'loaded', data } : { type: 'error' }
        )
      )
      .catch(() => setState({ type: 'error' }));
  }, []);

  React.useEffect(fetchStats, [fetchStats]);

  const handleSort = React.useCallback(
    (sortField: SortField): void =>
      setSortConfig((old) => ({
        sortField,
        ascending: sortField === old.sortField ? !old.ascending : true,
      })),
    []
  );

  const sortedData = React.useMemo(
    () =>
      state.type === 'loaded'
        ? Array.from(state.data).sort(
            sortFunction(
              (stat: CollectionStat) => stat[sortConfig.sortField],
              !sortConfig.ascending
            )
          )
        : [],
    [state, sortConfig]
  );

  const count = state.type === 'loaded' ? state.data.length : undefined;

  return (
    <Dialog
      buttons={
        <>
          <Button.Info onClick={fetchStats}>
            {collectionStatisticsText.refresh()}
          </Button.Info>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      header={
        count === undefined
          ? collectionStatisticsText.collectionStatistics()
          : commonText.countLine({
              resource: collectionStatisticsText.collectionStatistics(),
              count,
            })
      }
      onClose={handleClose}
    >
      <StatisticsContent
        sortConfig={sortConfig}
        sortedData={sortedData}
        state={state}
        onSort={handleSort}
      />
    </Dialog>
  );
}

function StatisticsContent({
  state,
  sortConfig,
  sortedData,
  onSort: handleSort,
}: {
  readonly state: FetchState;
  readonly sortConfig: SortConfig<SortField>;
  readonly sortedData: RA<CollectionStat>;
  readonly onSort: (field: SortField) => void;
}): JSX.Element {
  if (state.type === 'loading')
    return <div className="flex justify-center p-4">{loadingGif}</div>;
  if (state.type === 'error')
    return <p role="alert">{collectionStatisticsText.loadingError()}</p>;
  if (state.data.length === 0)
    return <p>{collectionStatisticsText.noStatistics()}</p>;
  return (
    <table className="grid-table grid-cols-[1fr_auto_auto] gap-2">
      <thead>
        <tr>
          <SortableHeader
            field="name"
            label={collectionStatisticsText.collectionName()}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          <SortableHeader
            field="specimenCount"
            label={collectionStatisticsText.numberOfSpecimens()}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          <SortableHeader
            field="collectionType"
            label={collectionStatisticsText.collectionType()}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </tr>
      </thead>
      <tbody>
        {sortedData.map((stat) => (
          <tr key={stat.name}>
            <td>{stat.name}</td>
            <td className="justify-end tabular-nums">
              {stat.specimenCount.toLocaleString()}
            </td>
            <td>{stat.collectionType}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SortableHeader({
  field,
  label,
  sortConfig,
  onSort: handleSort,
}: {
  readonly field: SortField;
  readonly label: LocalizedString;
  readonly sortConfig: SortConfig<SortField>;
  readonly onSort: (field: SortField) => void;
}): JSX.Element {
  return (
    <th scope="col">
      <Button.LikeLink onClick={(): void => handleSort(field)}>
        {label}
        <SortIndicator fieldName={field} sortConfig={sortConfig} />
      </Button.LikeLink>
    </th>
  );
}
