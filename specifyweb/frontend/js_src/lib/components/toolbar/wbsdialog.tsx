/**
 * Render a dialog for choosing a data set
 *
 * @module
 */

import React from 'react';

import ajax from '../../ajax';
import { DataSetMeta } from '../../datasetmeta';
import commonText from '../../localization/common';
import wbText from '../../localization/workbench';
import * as navigation from '../../navigation';
import type { RA } from '../../types';
import userInfo from '../../userinfo';
import uniquifyDataSetName from '../../wbuniquifyname';
import { compareValues, SortIndicator, useTitle } from '../common';
import { DateElement } from '../internationalization';
import type { MenuItem } from '../main';
import { closeDialog, LoadingScreen, ModalDialog } from '../modaldialog';
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
      Accept: 'application/json',
    },
  }).then(({ data: { id } }) => navigation.go(`/workbench-plan/${id}/`));

// TODO: get rid of this
/**
 * React Wrapper for Data Set Meta Backbone View
 */
function DsMeta({
  dsId,
  onClose,
}: {
  readonly dsId: number;
  readonly onClose: () => void;
}): JSX.Element {
  const [dataset, setDataset] = React.useState<Dataset | undefined>(undefined);
  const dialog = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    ajax<Dataset>(`/api/workbench/dataset/${dsId}/`).then(({ data }) =>
      destructorCalled ? undefined : setDataset(data)
    );
    let destructorCalled = false;
    return () => {
      destructorCalled = true;
    };
  }, [dsId]);

  React.useEffect(() => {
    if (typeof dataset === 'undefined' || dialog === null) return;

    const dataSetMeta = new DataSetMeta({
      dataset,
      el: dialog,
      onClose,
    });

    dataSetMeta.render();

    return () => dataSetMeta.remove();
  }, [dataset, dialog]);

  return (
    <div>
      <div ref={dialog} />
    </div>
  );
}

function Dialog({
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
    bucketName: 'sort-config',
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
      <ModalDialog
        properties={{
          title: showTemplates
            ? wbText('wbsDialogTemplatesDialogTitle')
            : wbText('wbsDialogDefaultDialogTitle')(datasets.length),
          width: 600,
          minHeight: 300,
          maxHeight: 800,
          close: handleClose,
          buttons: [
            ...(canImport
              ? [
                  {
                    text: wbText('importFile'),
                    click: (): void => navigation.go('/workbench-import/'),
                  },
                  {
                    text: wbText('createNew'),
                    click: createEmptyDataSet,
                  },
                ]
              : []),
            { text: commonText('close'), click: closeDialog },
          ],
        }}
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
            <table
              className="grid-table"
              style={{ gridTemplateColumns: '1fr auto auto auto' }}
            >
              <thead>
                <tr>
                  <th scope="col" className="pl-table-icon">
                    <button
                      type="button"
                      className="fake-link"
                      onClick={(): void =>
                        setSortConfig({
                          sortField: 'name',
                          ascending: !sortConfig.ascending,
                        })
                      }
                    >
                      {commonText('name')}
                      <SortIndicator fieldName="name" sortConfig={sortConfig} />
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className="fake-link"
                      onClick={(): void =>
                        setSortConfig({
                          sortField: 'dateCreated',
                          ascending: !sortConfig.ascending,
                        })
                      }
                    >
                      {commonText('created')}
                      <SortIndicator
                        fieldName="dateCreated"
                        sortConfig={sortConfig}
                      />
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className="fake-link"
                      onClick={(): void =>
                        setSortConfig({
                          sortField: 'dateUploaded',
                          ascending: !sortConfig.ascending,
                        })
                      }
                    >
                      {commonText('uploaded')}
                      <SortIndicator
                        fieldName="dateUploaded"
                        sortConfig={sortConfig}
                      />
                    </button>
                  </th>
                  <td />
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset, index) => {
                  return (
                    <tr key={index}>
                      <td style={{ overflowX: 'auto' }}>
                        <a
                          style={{ fontWeight: 800 }}
                          href={`/specify/workbench/${dataset.id}/`}
                          {...(typeof handleDataSetSelect === 'undefined'
                            ? {
                                className: 'intercept-navigation fake-link',
                              }
                            : {
                                onClick: (event): void => {
                                  event.preventDefault();
                                  handleDataSetSelect(dataset.id);
                                },
                              })}
                        >
                          <img
                            src="/images/Workbench32x32.png"
                            alt=""
                            style={{ width: 'var(--table-icon-size)' }}
                          />
                          {dataset.name}
                        </a>
                      </td>
                      <td>
                        <DateElement date={dataset.timestampcreated} />
                      </td>
                      <td>
                        <DateElement date={dataset.uploadresult?.timestamp} />
                      </td>
                      <td>
                        {canImport && (
                          <button
                            type="button"
                            className="fake-link ui-icon ui-icon-pencil"
                            onClick={(): void => setShowMeta(dataset.id)}
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
      </ModalDialog>
      {showMeta !== false && (
        <DsMeta dsId={showMeta} onClose={(): void => setShowMeta(false)} />
      )}
    </>
  );
}

/**
 * Render a dialog for choosing a data set
 */
export function WbsDialog({
  onClose: handleClose,
  showTemplates,
  onDataSetSelect: handleDataSetSelect,
}: {
  readonly showTemplates: boolean;
  readonly onClose: () => void;
  readonly onDataSetSelect?: (id: number) => void;
}) {
  useTitle(commonText('workbench'));

  const [datasets, setDatasets] = React.useState<undefined | RA<DatasetBrief>>(
    undefined
  );

  const fetchDatasets = () =>
    void ajax<RA<DatasetBrief>>(
      `/api/workbench/dataset/${showTemplates ? '?with_plan' : ''}`,
      { headers: { Accept: 'application/json' } }
    ).then(({ data }) => setDatasets(data));

  React.useEffect(fetchDatasets, []);

  return typeof datasets === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <Dialog
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
  path: '/specify/workbench',
  view: ({ onClose }) => new View({ onClose, showTemplates: false }),
};

export default menuItem;
