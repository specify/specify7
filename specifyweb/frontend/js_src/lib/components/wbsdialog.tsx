/*
 * The dialog for choosing a data set
 *
 */

import '../../css/wbdsdialog.css';

import $ from 'jquery';
import React from 'react';

import navigation from '../navigation';
import userInfo from '../userinfo';
import uniquifyDataSetName from '../wbuniquifyname';
import { LoadingScreen, ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { DatasetBrief, RA } from './wbplanview';

const createEmptyDataSet = async (): Promise<void> =>
  $.ajax('/api/workbench/dataset/', {
    type: 'POST',
    data: JSON.stringify({
      name: await uniquifyDataSetName(
        `New Data Set ${new Date().toDateString()}`
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

function Dialog({
  datasets,
  showTemplates,
  onDataSetSelect: handleDataSetSelect,
  onClose: handleClose,
}: {
  readonly datasets: RA<DatasetBrief>;
  readonly showTemplates: boolean;
  readonly onDataSetSelect?: (id: number) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const canImport =
    !showTemplates && !(userInfo as { isReadOnly: boolean }).isReadOnly;

  return (
    <ModalDialog
      onCloseCallback={handleClose}
      properties={{
        title: showTemplates
          ? 'Copy plan from existing Sata Det'
          : `Data Sets (${datasets.length})`,
        width: 600,
        minHeight: 300,
        buttons: {
          ...(canImport
            ? {
                'Import a File': (): void =>
                  navigation.go('/workbench-import/'),
                'Create New': createEmptyDataSet,
              }
            : {}),
          Cancel: handleClose,
        },
      }}
    >
      <br />
      {datasets.length === 0 ? (
        <p>
          {showTemplates
            ? 'There are no plans available, please continue to create an' +
              ' upload plan.'
            : `No Data Sets present. ${
                canImport ? 'Use the "Import" button to import data.' : ''
              }`}
        </p>
      ) : (
        <span className="table-list-dialog">
          <table className="wb-ds-dialog-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Created</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((dataset, index) => {
                const dateCreated = new Date(dataset.timestampcreated);
                const dateUploaded =
                  dataset.uploadresult?.success === true
                    ? new Date(dataset.uploadresult.timestamp)
                    : undefined;

                return (
                  <tr key={index}>
                    <td>
                      <a
                        href={`/workbench/${dataset.id}/`}
                        {...(typeof handleDataSetSelect === 'undefined'
                          ? {
                              className: 'intercept-navigation',
                            }
                          : {
                              onClick: (event) => {
                                event.preventDefault();
                                handleDataSetSelect(dataset.id);
                              },
                            })}
                      >
                        <img src="/images/Workbench32x32.png" alt="" />
                        {dataset.name}
                      </a>
                    </td>
                    <td title={dateCreated.toLocaleString()}>
                      {dateCreated.toDateString()}
                    </td>
                    <td title={dateUploaded?.toLocaleString() ?? ''}>
                      {dateUploaded?.toDateString() ?? ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </span>
      )}
    </ModalDialog>
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

  React.useEffect(() => {
    fetch(`/api/workbench/dataset/${showTemplates ? '?with_plan' : ''}`)
      .then(async (response) => response.json())
      .then(setDatasets)
      .catch((error) => {
        throw error;
      });
  }, []);

  return typeof datasets === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <Dialog
      datasets={datasets}
      onClose={handleClose}
      showTemplates={showTemplates}
      onDataSetSelect={handleDataSetSelect}
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
