/*
 * The dialog for choosing a data set
 *
 */

'use strict';

import React from 'react';
import '../../css/wbdsdialog.css';
import navigation from '../navigation';
import { ModalDialog, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { DatasetBrief } from './wbplanview';
import userInfo from '../userinfo';

function Dialog({
  datasets,
  showTemplates,
  onDataSetSelect: handleDataSetSelect,
  onClose: handleClose,
}: {
  readonly datasets: DatasetBrief[];
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
        title: showTemplates ? 'Copy plan from existing data set' : 'Data Sets',
        maxHeight: 600,
        width: 600,
        buttons: [
          ...(canImport
            ? [
                {
                  text: 'Import',
                  click: (): void => navigation.go('/workbench-import/'),
                },
              ]
            : []),
          {
            text: 'Cancel',
            click: handleClose,
          },
        ],
      }}
    >
      {datasets.length === 0 ? (
        <p>
          No Data Sets present.
          {canImport ? '' : 'Use the "Import" button to import data.'}
        </p>
      ) : (
        <span className="table-list-dialog">
          <table className="wb-ds-dialog-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Uploaded</th>
                <th>Created</th>
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
                    <td title={dateUploaded?.toLocaleString() ?? ''}>
                      {dateUploaded?.toDateString() ?? ''}
                    </td>
                    <td title={dateCreated.toLocaleString()}>
                      {dateCreated.toDateString()}
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
  const [datasets, setDatasets] = React.useState<undefined | DatasetBrief[]>(
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
