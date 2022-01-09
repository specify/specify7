/**
 * Render a dialog for choosing a data set
 *
 * @module
 */

import React from 'react';

import ajax from '../../ajax';
import commonText from '../../localization/common';
import wbText from '../../localization/workbench';
import * as navigation from '../../navigation';
import type { RA } from '../../types';
import userInfo from '../../userinfo';
import uniquifyDataSetName from '../../wbuniquifyname';
import { BlueButton, ButtonLikeLink, Link } from '../basic';
import type { SortConfig } from '../common';
import { compareValues, SortIndicator } from '../common';
import { DataSetMeta } from '../datasetmeta';
import { useTitle } from '../hooks';
import { DateElement } from '../internationalization';
import type { MenuItem } from '../main';
import { Dialog, dialogClassNames, LoadingScreen } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import { useCachedState } from '../stateCache';
import type { Dataset, DatasetBrief } from '../wbplanview';

const createEmptyDataSet = async (): Promise<void> =>
  ajax<Dataset>('/api/workbench/dataset/', {
    method: 'POST',
    body: {
      name: await uniquifyDataSetName(
        wbText('newDataSetName')(new Date().toDateString())
      ),
      importedfilename: '',
      columns: [],
      rows: [],
    },
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: 'application/json',
    },
  }).then(({ data: { id } }) => navigation.go(`/workbench-plan/${id}/`));

/**
 * Wrapper for Data Set Meta
 */
function DsMeta({
  dsId,
  onClose: handleClose,
}: {
  readonly dsId: number;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [dataset, setDataset] = React.useState<Dataset | undefined>(undefined);

  React.useEffect(() => {
    void ajax<Dataset>(`/api/workbench/dataset/${dsId}/`).then(({ data }) =>
      destructorCalled ? undefined : setDataset(data)
    );
    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [dsId]);
  return typeof dataset === 'undefined' ? null : (
    <DataSetMeta
      dataset={dataset}
      onClose={handleClose}
      onChange={handleClose}
    />
  );
}

function TableHeader({
  sortConfig,
  onChange: handleChange,
}: {
  readonly sortConfig: SortConfig<'name' | 'dateCreated' | 'dateUploaded'>;
  readonly onChange: (
    newSortConfig: SortConfig<'name' | 'dateCreated' | 'dateUploaded'>
  ) => void;
}): JSX.Element {
  return (
    <thead>
      <tr>
        <th
          scope="col"
          className="pl-[calc(theme(spacing.table-icon)_+_theme(spacing.2))]"
        >
          <ButtonLikeLink
            onClick={(): void =>
              handleChange({
                sortField: 'name',
                ascending: !sortConfig.ascending,
              })
            }
          >
            {commonText('name')}
            <SortIndicator fieldName="name" sortConfig={sortConfig} />
          </ButtonLikeLink>
        </th>
        <th scope="col">
          <ButtonLikeLink
            onClick={(): void =>
              handleChange({
                sortField: 'dateCreated',
                ascending: !sortConfig.ascending,
              })
            }
          >
            {commonText('created')}
            <SortIndicator fieldName="dateCreated" sortConfig={sortConfig} />
          </ButtonLikeLink>
        </th>
        <th scope="col">
          <ButtonLikeLink
            onClick={(): void =>
              handleChange({
                sortField: 'dateUploaded',
                ascending: !sortConfig.ascending,
              })
            }
          >
            {commonText('uploaded')}
            <SortIndicator fieldName="dateUploaded" sortConfig={sortConfig} />
          </ButtonLikeLink>
        </th>
        <td />
      </tr>
    </thead>
  );
}

function MetadataDialog({
  datasets: unsortedDatasets,
  showTemplates,
  onDataSetSelect: handleDataSetSelect,
  onClose: handleClose,
  onChange: handleChange,
}: {
  readonly datasets: RA<DatasetBrief>;
  readonly showTemplates: boolean;
  readonly onDataSetSelect?: (id: number) => void;
  readonly onClose: () => void;
  readonly onChange: () => void;
}): JSX.Element | null {
  // Whether to show DS meta dialog. Either false or Data Set ID
  const [showMeta, setShowMeta] = React.useState<false | number>(false);

  const isFirstRender = React.useRef<boolean>(true);
  React.useEffect(() => {
    if (isFirstRender.current) isFirstRender.current = false;
    else handleChange();
  }, [showMeta]);

  const canImport =
    !showTemplates &&
    !(userInfo as unknown as { isReadOnly: boolean }).isReadOnly;

  const [sortConfig, setSortConfig] = useCachedState({
    bucketName: 'sortConfig',
    cacheName: 'listOfDataSets',
    bucketType: 'localStorage',
    defaultValue: {
      sortField: 'dateCreated',
      ascending: false,
    },
  });

  if (typeof sortConfig === 'undefined') return null;

  const datasets = Array.from(unsortedDatasets).sort(
    (
      {
        name: nameLeft,
        timestampcreated: dateCreatedLeft,
        uploadresult: uploadResultLeft,
      },
      {
        name: nameRight,
        timestampcreated: dateCreatedRight,
        uploadresult: uploadResultRight,
      }
    ) =>
      sortConfig.sortField === 'name'
        ? compareValues(sortConfig.ascending, nameLeft, nameRight)
        : sortConfig.sortField === 'dateCreated'
        ? compareValues(sortConfig.ascending, dateCreatedLeft, dateCreatedRight)
        : compareValues(
            sortConfig.ascending,
            uploadResultLeft?.timestamp ?? '',
            uploadResultRight?.timestamp ?? ''
          )
  );

  return (
    <>
      <Dialog
        header={
          showTemplates
            ? wbText('wbsDialogTemplatesDialogTitle')
            : wbText('wbsDialogDefaultDialogTitle')(datasets.length)
        }
        className={{
          container: dialogClassNames.wideContainer,
        }}
        onClose={handleClose}
        buttons={[
          'close',
          <>
            {canImport && (
              <>
                <BlueButton
                  onClick={(): void => navigation.go('/workbench-import/')}
                >
                  {wbText('importFile')}
                </BlueButton>
                <BlueButton onClick={createEmptyDataSet}>
                  {wbText('createNew')}
                </BlueButton>
              </>
            )}
          </>,
        ]}
      >
        {datasets.length === 0 ? (
          <p>
            {showTemplates
              ? wbText('wbsDialogEmptyTemplateDialogMessage')
              : `${wbText('wbsDialogEmptyDefaultDialogMessage')} ${
                  canImport ? wbText('createDataSetInstructions') : ''
                }`}
          </p>
        ) : (
          <nav>
            <table className="grid-table grid-cols-[1fr_auto_auto_auto] gap-2">
              <TableHeader
                sortConfig={sortConfig}
                onChange={(newSortConfig): void => setSortConfig(newSortConfig)}
              />
              <tbody>
                {datasets.map((dataset, index) => {
                  return (
                    <tr key={index}>
                      <td className="overflow-x-auto">
                        <Link
                          href={`/specify/workbench/${dataset.id}/`}
                          {...(typeof handleDataSetSelect === 'undefined'
                            ? {
                                className: 'intercept-navigation font-bold',
                              }
                            : {
                                className: 'font-bold',
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
                        </Link>
                      </td>
                      <td>
                        <DateElement date={dataset.timestampcreated} />
                      </td>
                      <td>
                        <DateElement date={dataset.uploadresult?.timestamp} />
                      </td>
                      <td>
                        {canImport && (
                          <ButtonLikeLink
                            className="ui-icon ui-icon-pencil"
                            onClick={(): void => setShowMeta(dataset.id)}
                            aria-label={commonText('edit')}
                            title={commonText('edit')}
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
      {showMeta !== false && (
        <DsMeta dsId={showMeta} onClose={(): void => setShowMeta(false)} />
      )}
    </>
  );
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
}): JSX.Element {
  useTitle(commonText('workbench'));

  const [datasets, setDatasets] = React.useState<undefined | RA<DatasetBrief>>(
    undefined
  );

  const fetchDatasets = () =>
    void ajax<RA<DatasetBrief>>(
      `/api/workbench/dataset/${showTemplates ? '?with_plan' : ''}`,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { headers: { Accept: 'application/json' } }
    ).then(({ data }) => setDatasets(data));

  React.useEffect(fetchDatasets, []);

  return typeof datasets === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <MetadataDialog
      datasets={datasets}
      onClose={handleClose}
      showTemplates={showTemplates}
      onDataSetSelect={handleDataSetSelect}
      onChange={fetchDatasets}
    />
  );
}

const View = createBackboneView(WbsDialog);

const menuItem: MenuItem = {
  task: 'workbenches',
  title: commonText('workbench'),
  icon: '/static/img/workbench.png',
  view: ({ onClose }) => new View({ onClose, showTemplates: false }),
};

export default menuItem;
