/*
 * The dialog for choosing a data set
 *
 */

import '../../css/wbsdialog.css';

import $ from 'jquery';
import React from 'react';

import { DataSetMeta } from '../datasetmeta';
import commonText from '../localization/common';
import wbText from '../localization/workbench';
import * as navigation from '../navigation';
import userInfo from '../userinfo';
import { uniquifyDataSetName } from '../wbuniquifyname';
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
    !showTemplates &&
    !(userInfo as unknown as { isReadOnly: boolean }).isReadOnly;

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
          <span className="table-list-dialog">
            <div className="wbs-dialog-table">
              <div className="wbs-dialog-header">
                <div className="wbs-dialog-cell">{commonText('name')}</div>
                <div className="wbs-dialog-cell">{commonText('created')}</div>
                <div className="wbs-dialog-cell">{commonText('uploaded')}</div>
                <div className="wbs-dialog-cell" />
              </div>
              <div className="wbs-dialog-body">
                {datasets.map((dataset, index) => {
                  const dateCreated = new Date(dataset.timestampcreated);
                  const dateUploaded =
                    dataset.uploadresult?.success === true
                      ? new Date(dataset.uploadresult.timestamp)
                      : undefined;

                  return (
                    <div className="wbs-dialog-row" key={index}>
                      <div className="wbs-dialog-cell">
                        <a
                          style={{ fontWeight: 800 }}
                          href={`/specify/workbench/${dataset.id}/`}
                          {...(typeof handleDataSetSelect === 'undefined'
                            ? {
                                className: 'intercept-navigation',
                              }
                            : {
                                onClick: (event): void => {
                                  event.preventDefault();
                                  handleDataSetSelect(dataset.id);
                                },
                              })}
                        >
                          <img src="/images/Workbench32x32.png" alt="" />
                          {dataset.name}
                        </a>
                      </div>
                      <div
                        className="wbs-dialog-cell"
                        title={dateCreated.toLocaleString()}
                      >
                        {dateCreated.toDateString()}
                      </div>
                      <div
                        className="wbs-dialog-cell"
                        title={dateUploaded?.toLocaleString() ?? undefined}
                      >
                        {dateUploaded?.toDateString() ?? ''}
                      </div>
                      <div className="wbs-dialog-cell">
                        {canImport && (
                          <span
                            tabIndex={0}
                            style={{ cursor: 'pointer' }}
                            className="ui-icon ui-icon-pencil"
                            onClick={(): void => setShowMeta(dataset.id)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </span>
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
}: ComponentProps) {
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

interface Props {
  showTemplates: boolean;
}

interface ComponentProps extends Readonly<Props> {
  readonly onClose: () => void;
  readonly onDataSetSelect?: (id: number) => void;
}

export default createBackboneView<Props, Props, ComponentProps>({
  moduleName: 'WbsDialog',
  className: 'wbs-dialog',
  initialize(self, { showTemplates }) {
    self.showTemplates = showTemplates;
  },
  Component: WbsDialog,
  getComponentProps: (self) => ({
    onClose: (): void => self.remove(),
    showTemplates: self.showTemplates,
  }),
});
