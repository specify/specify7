/*
 * The dialog for choosing a data set
 *
 */

import $ from 'jquery';
import React from 'react';

import { DataSetMeta } from '../datasetmeta';
import commonText from '../localization/common';
import wbText from '../localization/workbench';
import navigation from '../navigation';
import userInfo from '../userinfo';
import uniquifyDataSetName from '../wbuniquifyname';
import { DateElement } from './common';
import { closeDialog, LoadingScreen, ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { Dataset, DatasetBrief, RA } from './wbplanview';

const createEmptyDataSet = async (): Promise<void> =>
  $.ajax('/api/workbench/dataset/', {
    type: 'POST',
    data: JSON.stringify({
      name: await uniquifyDataSetName(
        wbText('newDataSetName')(new Date().toDateString())
      ),
      importedfilename: '',
      columns: [],
      rows: [],
    }),
    contentType: 'application/json',
    processData: false,
  })
    .done(({ id }) => navigation.go(`/workbench-plan/${id}/`))
    .fail((error) => {
      throw error;
    });

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
    let datasetPromise: undefined | Promise<Dataset> = new Promise((resolve) =>
      $.ajax(`/api/workbench/dataset/${dsId}/`).done(resolve)
    );
    datasetPromise.then((dataset) => {
      if (typeof datasetPromise !== 'undefined') setDataset(dataset);
    });
    return () => {
      datasetPromise = undefined;
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
  datasets,
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
}): JSX.Element {
  // Whether to show DS meta dialog. Either false or DS ID
  const [showMeta, setShowMeta] = React.useState<false | number>(false);

  const isFirstRender = React.useRef<boolean>(true);
  React.useEffect(() => {
    if (isFirstRender.current) isFirstRender.current = false;
    else handleChange();
  }, [showMeta]);

  const canImport =
    !showTemplates && !(userInfo as { isReadOnly: boolean }).isReadOnly;

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
        <br />
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
                    {commonText('name')}
                  </th>
                  <th scope="col">{commonText('created')}</th>
                  <th scope="col">{commonText('uploaded')}</th>
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

export function WbsDialog({
  onClose: handleClose,
  showTemplates,
  onDataSetSelect: handleDataSetSelect,
}: Props & { readonly onDataSetSelect?: (id: number) => void }) {
  const [datasets, setDatasets] = React.useState<undefined | RA<DatasetBrief>>(
    undefined
  );

  const fetchDatasets = () => {
    fetch(`/api/workbench/dataset/${showTemplates ? '?with_plan' : ''}`)
      .then(async (response) => response.json())
      .then(setDatasets)
      .catch((error) => {
        throw error;
      });
  };

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

type Props = {
  readonly showTemplates: boolean;
  readonly onClose: () => void;
};

export default createBackboneView<Props>({
  moduleName: 'WbsDialog',
  className: 'wbs-dialog',
  component: WbsDialog,
});
