/**
 * Render a dialog for choosing a data set
 *
 * @module
 */

import React from 'react';

import { ajax, Http } from '../../ajax';
import { sortFunction } from '../../helpers';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { hasPermission } from '../../permissionutils';
import { getUserPref } from '../../preferencesutils';
import type { RA } from '../../types';
import { uniquifyDataSetName } from '../../wbuniquifyname';
import { Button, className, DataEntry, Link } from '../basic';
import type { SortConfig } from '../common';
import { SortIndicator, useSortConfig } from '../common';
import { DataSetMeta } from '../datasetmeta';
import { ErrorBoundary } from '../errorboundary';
import { useAsyncState, useTitle } from '../hooks';
import { icons } from '../icons';
import { DateElement } from '../internationalization';
import type { MenuItem } from '../main';
import { Dialog, dialogClassNames } from '../modaldialog';
import { goTo } from '../navigation';
import type { Dataset, DatasetBrief } from '../wbplanview';

const createEmptyDataSet = async (): Promise<void> =>
  ajax<Dataset>(
    '/api/workbench/dataset/',
    {
      method: 'POST',
      body: {
        name: await uniquifyDataSetName(
          wbText('newDataSetName', new Date().toDateString())
        ),
        importedfilename: '',
        columns: [],
        rows: [],
      },
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Accept: 'application/json',
      },
    },
    {
      expectedResponseCodes: [Http.CREATED],
    }
  ).then(({ data: { id } }) => goTo(`/workbench-plan/${id}/`));

/** Wrapper for Data Set Meta */
function DsMeta({
  dsId,
  onClose: handleClose,
}: {
  readonly dsId: number;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [dataset] = useAsyncState<Dataset>(
    React.useCallback(
      async () =>
        ajax<Dataset>(`/api/workbench/dataset/${dsId}/`, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      [dsId]
    ),
    true
  );

  return typeof dataset === 'object' ? (
    <DataSetMeta
      dataset={dataset}
      onClose={handleClose}
      onChange={handleClose}
    />
  ) : null;
}

function TableHeader({
  sortConfig,
  onSort: handleSort,
}: {
  readonly sortConfig: SortConfig<'name' | 'dateCreated' | 'dateUploaded'>;
  readonly onSort: (sortField: 'name' | 'dateCreated' | 'dateUploaded') => void;
}): JSX.Element {
  return (
    <thead>
      <tr>
        <th
          scope="col"
          className="pl-[calc(theme(spacing.table-icon)_+_theme(spacing.2))]"
        >
          <Button.LikeLink onClick={(): void => handleSort('name')}>
            {commonText('name')}
            <SortIndicator fieldName="name" sortConfig={sortConfig} />
          </Button.LikeLink>
        </th>
        <th scope="col">
          <Button.LikeLink onClick={(): void => handleSort('dateCreated')}>
            {commonText('created')}
            <SortIndicator fieldName="dateCreated" sortConfig={sortConfig} />
          </Button.LikeLink>
        </th>
        <th scope="col">
          <Button.LikeLink onClick={(): void => handleSort('dateUploaded')}>
            {commonText('uploaded')}
            <SortIndicator fieldName="dateUploaded" sortConfig={sortConfig} />
          </Button.LikeLink>
        </th>
        <td />
      </tr>
    </thead>
  );
}

const defaultSortConfig = {
  sortField: 'dateCreated',
  ascending: false,
} as const;

function DataSets({
  onClose: handleClose,
  showTemplates,
  onDataSetSelect: handleDataSetSelect,
  onShowMeta: handleShowMeta,
}: {
  readonly showTemplates: boolean;
  readonly onClose: () => void;
  readonly onDataSetSelect?: (id: number) => void;
  readonly onShowMeta: (dataSet: number) => void;
}): JSX.Element | null {
  const [unsortedDatasets] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<RA<DatasetBrief>>(
          `/api/workbench/dataset/${showTemplates ? '?with_plan' : ''}`,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          { headers: { Accept: 'application/json' } }
        ).then(({ data }) => data),
      [showTemplates]
    ),
    true
  );

  const [sortConfig = defaultSortConfig, handleSort] =
    useSortConfig('listOfDataSets');

  const datasets = Array.isArray(unsortedDatasets)
    ? Array.from(unsortedDatasets).sort(
        sortFunction(
          ({ name, timestampcreated, uploadresult }) =>
            sortConfig.sortField === 'name'
              ? name
              : sortConfig.sortField === 'dateCreated'
              ? timestampcreated
              : uploadresult?.timestamp ?? '',
          !sortConfig.ascending
        )
      )
    : undefined;

  const canImport =
    hasPermission('/workbench/dataset', 'create') && !showTemplates;
  return Array.isArray(datasets) ? (
    <Dialog
      icon={<span className="text-blue-500">{icons.table}</span>}
      header={
        showTemplates
          ? wbText('wbsDialogTemplatesDialogTitle')
          : wbText('wbsDialogDefaultDialogTitle', datasets.length)
      }
      className={{
        container: dialogClassNames.wideContainer,
      }}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          {canImport && (
            <>
              <Link.Blue href={'/specify/workbench-import/'}>
                {wbText('importFile')}
              </Link.Blue>
              <Button.Blue onClick={createEmptyDataSet}>
                {wbText('createNew')}
              </Button.Blue>
            </>
          )}
        </>
      }
    >
      {datasets.length === 0 ? (
        <p>
          {showTemplates
            ? wbText('wbsDialogEmptyTemplateDialogText')
            : `${wbText('wbsDialogEmptyDefaultDialogText')} ${
                canImport ? wbText('createDataSetInstructions') : ''
              }`}
        </p>
      ) : (
        <nav>
          <table className="grid-table grid-cols-[1fr_auto_auto_auto] gap-2">
            <TableHeader sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {datasets.map((dataset, index) => {
                return (
                  <tr key={index}>
                    <td className="overflow-x-auto">
                      <Link.Default
                        href={`/specify/workbench/${dataset.id}/`}
                        {...(handleDataSetSelect === undefined
                          ? {
                              className: 'font-bold',
                            }
                          : {
                              className: `font-bold ${className.navigationHandled}`,
                              onClick: (event): void => {
                                event.preventDefault();
                                handleDataSetSelect(dataset.id);
                              },
                            })}
                      >
                        <img
                          src="/images/Workbench32x32.png"
                          alt=""
                          className="w-table-icon"
                        />
                        {dataset.name}
                      </Link.Default>
                    </td>
                    <td>
                      <DateElement date={dataset.timestampcreated} />
                    </td>
                    <td>
                      <DateElement
                        date={
                          dataset.uploadresult?.success === true
                            ? dataset.uploadresult?.timestamp
                            : undefined
                        }
                      />
                    </td>
                    <td>
                      {canImport && (
                        <DataEntry.Edit
                          onClick={(): void => handleShowMeta(dataset.id)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </nav>
      )}
    </Dialog>
  ) : null;
}

/** Render a dialog for choosing a data set */
export function WbsDialog({
  onClose: handleClose,
  showTemplates,
  onDataSetSelect: handleDataSetSelect,
}: {
  readonly showTemplates: boolean;
  readonly onClose: () => void;
  readonly onDataSetSelect?: (id: number) => void;
}): JSX.Element | null {
  useTitle(commonText('workBench'));

  // Whether to show DS meta dialog. Either false or Data Set ID
  const [showMeta, setShowMeta] = React.useState<false | number>(false);

  return (
    <>
      <DataSets
        onClose={handleClose}
        showTemplates={showTemplates}
        onDataSetSelect={handleDataSetSelect}
        onShowMeta={setShowMeta}
      />
      {showMeta !== false && (
        <DsMeta dsId={showMeta} onClose={(): void => setShowMeta(false)} />
      )}
    </>
  );
}

export const menuItem: MenuItem = {
  task: 'workbenches',
  title: commonText('workBench'),
  icon: icons.table,
  isOverlay: true,
  enabled: () => getUserPref('header', 'menu', 'showWorkBench'),
  view: ({ onClose: handleClose }) => (
    <ErrorBoundary dismissable>
      <WbsDialog onClose={handleClose} showTemplates={false} />
    </ErrorBoundary>
  ),
};
