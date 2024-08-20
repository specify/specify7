/**
 * Render a dialog for choosing a data set
 *
 * @module
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import type { AttachmentDataSet } from '../AttachmentsBulkImport/types';
import { LoadingContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import { tables } from '../DataModel/tables';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import type { SortConfig } from '../Molecules/Sorting';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission } from '../Permissions/helpers';
import { OverlayContext } from '../Router/Router';
import { uniquifyDataSetName } from '../WbImport/helpers';
import type { Dataset, DatasetBriefPlan } from '../WbPlanView/Wrapped';
import { WbDataSetMeta } from '../WorkBench/DataSetMeta';
import { formatUrl } from '../Router/queryString';
import { f } from '../../utils/functools';
import { batchEditText } from '../../localization/batchEdit';

const createWorkbenchDataSet = async () =>
  createEmptyDataSet<Dataset>(
    'workbench',
    wbText.newDataSetName({ date: new Date().toDateString() }),
    {
      importedfilename: '',
      columns: [],
    }
  );

export const createEmptyDataSet = async <
  DATASET extends AttachmentDataSet | Dataset
>(
  datasetVariant: keyof typeof datasetVariants,
  name: LocalizedString,
  props?: Partial<DATASET>
): Promise<DATASET> => 
  ajax<DATASET>(datasetVariants[datasetVariant].fetchUrl, {
    method: 'POST',
    body: {
      name: await uniquifyDataSetName(name, undefined, datasetVariant),
      rows: [],
      ...props,
    },
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: 'application/json',
    },
  }).then(({ data }) => data);

/** Wrapper for Data Set Meta */
export function DataSetMetaOverlay(): JSX.Element | null {
  const { dataSetId = '' } = useParams();
  const handleClose = React.useContext(OverlayContext);
  const [dataset] = useAsyncState<Dataset>(
    React.useCallback(
      async () =>
        ajax<Dataset>(`/api/workbench/dataset/${dataSetId}/`, {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      [dataSetId]
    ),
    true
  );

  const navigate = useNavigate();

  return typeof dataset === 'object' ? (
    <WbDataSetMeta
      dataset={dataset}
      onChange={handleClose}
      onClose={handleClose}
      onDeleted={(): void => navigate('/specify/', { replace: true })}
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
            {getField(tables.Workbench, 'name').label}
            <SortIndicator fieldName="name" sortConfig={sortConfig} />
          </Button.LikeLink>
        </th>
        <th scope="col">
          <Button.LikeLink onClick={(): void => handleSort('dateCreated')}>
            {getField(tables.Workbench, 'timestampCreated').label}
            <SortIndicator fieldName="dateCreated" sortConfig={sortConfig} />
          </Button.LikeLink>
        </th>
        <th scope="col">
          <Button.LikeLink onClick={(): void => handleSort('dateUploaded')}>
            {wbText.dataSetTimestampUploaded()}
            <SortIndicator fieldName="dateUploaded" sortConfig={sortConfig} />
          </Button.LikeLink>
        </th>
        <td />
      </tr>
    </thead>
  );
}


type WB_VARIANT = keyof Omit<typeof datasetVariants, "bulkAttachment">;

export function GenericDataSetsDialog({
  onClose: handleClose,
  onDataSetSelect: handleDataSetSelect,
  wbVariant
}: {
  readonly wbVariant: WB_VARIANT;
  readonly onClose: () => void;
  readonly onDataSetSelect?: (id: number) => void;
}): JSX.Element | null {
  const variant = datasetVariants[wbVariant];
  const [unsortedDatasets] = useAsyncState(
    React.useCallback(
      async () => ajax<RA<DatasetBriefPlan>>(formatUrl(variant.fetchUrl, {}), { headers: { Accept: 'application/json' } }).then(({data})=>data),
      [wbVariant]
    ),
    true
  );
  const [sortConfig, handleSort, applySortConfig] = useSortConfig(variant.sortConfig.key, variant.sortConfig.field, false);

  const datasets = Array.isArray(unsortedDatasets) ? applySortConfig(
    unsortedDatasets, ({ name, timestampcreated, uploadresult }) =>
    sortConfig.sortField === 'name'
      ? name
      : sortConfig.sortField === 'dateCreated'
      ? timestampcreated
      : uploadresult?.timestamp ?? '') : undefined;
    
  const navigate = useNavigate();
  const loading = React.useContext(LoadingContext);

  const {canImport, canEdit, header, onEmpty, route, metaRoute} = variant;

  return Array.isArray(datasets) ? <Dialog
  buttons={
    <>
      <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
      {variant.canImport() && (
        <>
          <Link.Info href="/specify/workbench/import/">
            {wbText.importFile()}
          </Link.Info>
          <Button.Info
            onClick={(): void =>
              loading(
                createWorkbenchDataSet().then(({ id }) =>
                  navigate(`/specify/workbench/plan/${id}/`)
                )
              )
            }
          >
            {wbText.createNew()}
          </Button.Info>
        </>
      )}
    </>
  }
  className={{
    container: dialogClassNames.wideContainer,
  }}
  dimensionsKey="DataSetsDialog"
  header={header(datasets.length)}
  icon={icons.table}
  onClose={handleClose}
>
  {datasets.length === 0 ? (
    <p>
      {onEmpty(canImport())}
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
                  href={route(dataset.id)}
                  onClick={
                    handleDataSetSelect
                      ? (event): void => {
                          event.preventDefault();
                          handleDataSetSelect(dataset.id);
                        }
                      : undefined
                  }
                >
                  <TableIcon
                    label
                    name={dataset.uploadplan?.baseTableName ?? 'Workbench'}
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
                {canEdit() && (
                  <Link.Icon
                    aria-label={commonText.edit()}
                    className={className.dataEntryEdit}
                    href={metaRoute(dataset.id)}
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
 : null;

}

const baseWbVariant = {
  fetchUrl: '/api/workbench/dataset/',
  sortConfig: {
    key: 'listOfDataSets',
    field: 'name'
  },
  canImport: ()=>hasPermission('/workbench/dataset', 'create'),
  header: (count: number)=>commonText.countLine({resource: wbText.dataSets({variant: wbText.workBench()}), count}),
  onEmpty: (canImport: boolean)=>`${wbText.wbsDialogEmpty()} ${canImport ? wbText.createDataSetInstructions() : ''}`,
  canEdit: ()=>hasPermission('/workbench/dataset', 'update'),
  route: (id: number)=>`/specify/workbench/${id}`,
  metaRoute: (id: number)=>`/specify/overlay/workbench/${id}/meta/`,
} as const;

export const datasetVariants = {
  'workbench': baseWbVariant,
  'workbenchChoosePlan': {
    fetchUrl: '/api/workbench/dataset/?with_plan',
    sortConfig: baseWbVariant.sortConfig,
    canImport: ()=>false, 
    header: ()=>wbPlanText.copyPlan(), 
    onEmpty: ()=>wbPlanText.noPlansToCopyFrom(),
    canEdit: ()=>false,
    route: baseWbVariant.route,
    metaRoute: baseWbVariant.metaRoute
  },
  'batchEdit': {
    fetchUrl: '/api/workbench/dataset/?isupdate=1',
    sortConfig: {
      key: 'listOfBatchEditDataSets',
      field: 'name'      
    },
    // Cannot import via the header
    canImport: ()=>false,
    header: (count: number)=>commonText.countLine({resource: wbText.dataSets({variant: batchEditText.batchEdit()}), count}),
    onEmpty: ()=>`${wbText.wbsDialogEmpty()} ${hasPermission('/workbench/dataset', 'create') ? batchEditText.createDataSetInstructions() : ''}`,
    canEdit: ()=>hasPermission('/workbench/dataset', 'update'),
    route: baseWbVariant.route,
    metaRoute: baseWbVariant.metaRoute
  },
  'bulkAttachment': {
    fetchUrl: '/attachment_gw/dataset/',
    sortConfig: {
      key: 'attachmentDatasets',
      field: 'name'      
    },
    canImport: ()=>hasPermission('/attachment_import/dataset', 'create'),
    header: f.never,
    onEmpty:f.never,
    canEdit: ()=>hasPermission('/attachment_import/dataset', 'update'),
    route: (id: number)=>`/specify/attachments/import/${id}`,
    // Actually, in retrorespect, this would be a nice feature
    metaRoute: f.never
  }
} as const;

export function DataSetsOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return <GenericDataSetsDialog wbVariant="workbench" onClose={handleClose} />;
}

export function BatchEditDataSetsOverlay(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  return <GenericDataSetsDialog wbVariant="batchEdit" onClose={handleClose} />;
}