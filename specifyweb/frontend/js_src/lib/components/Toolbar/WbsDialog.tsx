/**
 * Render a dialog for choosing a data set
 *
 * @module
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { uniquifyDataSetName } from '../../utils/uniquifyName';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import type { SortConfig } from '../Molecules/Sorting';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission } from '../Permissions/helpers';
import { OverlayContext } from '../Router/Router';
import type { Dataset, DatasetBrief } from '../WbPlanView/Wrapped';
import { DataSetMeta } from '../WorkBench/DataSetMeta';

const createEmptyDataSet = async (): Promise<Dataset> =>
  ajax<Dataset>(
    '/api/workbench/dataset/',
    {
      method: 'POST',
      body: {
        name: await uniquifyDataSetName(
          wbText.newDataSetName({ date: new Date().toDateString() })
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
  ).then(({ data }) => data);

/** Wrapper for Data Set Meta */
export function DataSetMetaOverlay(): JSX.Element | null {
  const { dataSetId = '' } = useParams();
  const handleClose = React.useContext(OverlayContext);
  const [dataset] = useAsyncState<Dataset>(
    React.useCallback(
      async () =>
        ajax<Dataset>(`/api/workbench/dataset/${dataSetId}/`, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      [dataSetId]
    ),
    true
  );

  const navigate = useNavigate();

  return typeof dataset === 'object' ? (
    <DataSetMeta
      dataset={dataset}
      onChange={handleClose}
      onClose={handleClose}
      onDeleted={() => navigate('/specify/', { replace: true })}
    />
  ) : null;
}

function TableHeader({
  sortConfig,
  onSort: handleSort,
}: {
  readonly sortConfig:
    | SortConfig<'dateCreated' | 'dateUploaded' | 'name'>
    | undefined;
  readonly onSort: (sortField: 'dateCreated' | 'dateUploaded' | 'name') => void;
}): JSX.Element {
  return (
    <thead>
      <tr>
        <th
          className="pl-[calc(theme(spacing.table-icon)_+_theme(spacing.2))]"
          scope="col"
        >
          <Button.LikeLink onClick={(): void => handleSort('name')}>
            {getField(schema.models.Workbench, 'name').label}
            <SortIndicator fieldName="name" sortConfig={sortConfig} />
          </Button.LikeLink>
        </th>
        <th scope="col">
          <Button.LikeLink onClick={(): void => handleSort('dateCreated')}>
            {getField(schema.models.Workbench, 'timestampCreated').label}
            <SortIndicator fieldName="dateCreated" sortConfig={sortConfig} />
          </Button.LikeLink>
        </th>
        <th scope="col">
          <Button.LikeLink onClick={(): void => handleSort('dateUploaded')}>
            {getField(schema.models.Workbench, 'timestampModified').label}
            <SortIndicator fieldName="dateUploaded" sortConfig={sortConfig} />
          </Button.LikeLink>
        </th>
        <td />
      </tr>
    </thead>
  );
}

/** Render a dialog for choosing a data set */
export function DataSetsDialog({
  onClose: handleClose,
  showTemplates,
  onDataSetSelect: handleDataSetSelect,
}: {
  readonly showTemplates: boolean;
  readonly onClose: () => void;
  readonly onDataSetSelect?: (id: number) => void;
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

  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    'listOfDataSets',
    'dateCreated',
    false
  );

  const datasets = Array.isArray(unsortedDatasets)
    ? applySortConfig(
        unsortedDatasets,
        ({ name, timestampcreated, uploadresult }) =>
          sortConfig.sortField === 'name'
            ? name
            : sortConfig.sortField === 'dateCreated'
            ? timestampcreated
            : uploadresult?.timestamp ?? ''
      )
    : undefined;

  const canImport =
    hasPermission('/workbench/dataset', 'create') && !showTemplates;
  const navigate = useNavigate();
  const loading = React.useContext(LoadingContext);
  return Array.isArray(datasets) ? (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          {canImport && (
            <>
              <Link.Blue href="/specify/workbench/import/">
                {wbText.importFile()}
              </Link.Blue>
              <Button.Blue
                onClick={(): void =>
                  loading(
                    createEmptyDataSet().then(({ id }) =>
                      navigate(`/specify/workbench/plan/${id}/`)
                    )
                  )
                }
              >
                {wbText.createNew()}
              </Button.Blue>
            </>
          )}
        </>
      }
      className={{
        container: dialogClassNames.wideContainer,
      }}
      dimensionsKey="DataSetsDialog"
      header={
        showTemplates
          ? wbPlanText.copyPlan()
          : commonText.countLine({
              resource: wbText.dataSets(),
              count: datasets.length,
            })
      }
      icon={<span className="text-blue-500">{icons.table}</span>}
      onClose={handleClose}
    >
      {datasets.length === 0 ? (
        <p>
          {showTemplates
            ? wbPlanText.noPlansToCopyFrom()
            : `${wbText.wbsDialogEmpty()} ${
                canImport ? wbText.createDataSetInstructions() : ''
              }`}
        </p>
      ) : (
        <nav>
          <table className="grid-table grid-cols-[1fr_auto_auto_auto] gap-2">
            <TableHeader sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {datasets.map((dataset, index) => (
                <tr key={index}>
                  <td className="min-w-[theme(spacing.40)] overflow-x-auto">
                    <Link.Default
                      className="font-bold"
                      href={`/specify/workbench/${dataset.id}/`}
                      onClick={
                        handleDataSetSelect
                          ? (event): void => {
                              event.preventDefault();
                              handleDataSetSelect(dataset.id);
                            }
                          : undefined
                      }
                    >
                      <TableIcon label={false} name="Workbench" />
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
                      <Link.Icon
                        aria-label={commonText.edit()}
                        className={className.dataEntryEdit}
                        href={`/specify/overlay/workbench/${dataset.id}/meta/`}
                        icon="pencil"
                        title={commonText.edit()}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </nav>
      )}
    </Dialog>
  ) : null;
}

export function DataSetsOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return <DataSetsDialog showTemplates={false} onClose={handleClose} />;
}
