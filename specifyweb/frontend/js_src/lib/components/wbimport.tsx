/**
 * Data Set import page
 *
 * @module
 */

import Papa from 'papaparse';
import React, { Component } from 'react';
import ImportXLSWorker from 'worker-loader!../wbimportxls.worker';

import { ajax, Http } from '../ajax';
import { encodings } from '../encodings';
import wbText from '../localization/workbench';
import * as navigation from '../navigation';
import type { IR } from '../types';
import { uniquifyHeaders } from '../wbplanviewheaderhelper';
import { f } from '../functools';
import { uniquifyDataSetName } from '../wbuniquifyname';
import { Button, Container, H2, H3, Input, Select } from './basic';
import { FilePicker } from './filepicker';
import { useTitle } from './hooks';
import createBackboneView from './reactbackboneextend';
import type { Dataset } from './wbplanview';

const PREVIEW_SIZE = 100;

type FileType = 'csv' | 'xls';

type ChooseFileState = { type: 'ChooseFileState' };

type PreviewFileState = {
  type: 'PreviewFileState';
  preview: string[][];
  file: File;
  encoding: string;
  datasetName: string;
  hasHeader: boolean;
  fileType: FileType;
};

type BadFileState = {
  type: 'BadFileState';
  file: File;
  encoding: string;
  fileType: FileType;
};

type LoadingFileState = {
  type: 'LoadingFileState';
  file: File;
  fileType: FileType;
  datasetName: string;
};

type WbImportState =
  | ChooseFileState
  | PreviewFileState
  | BadFileState
  | LoadingFileState;

type EncodingAction = { type: 'EncodingAction'; encoding: string };

type FileSelectedAction = {
  type: 'FileSelectedAction';
  file: File;
  fileType: FileType;
};

type GotPreviewAction = {
  type: 'GotPreviewAction';
  preview: string[][];
  file: File;
  fileType: FileType;
};

type BadImportFileAction = {
  type: 'BadImportFileAction';
  file: File;
  fileType: FileType;
};

type ToggleHeaderAction = { type: 'ToggleHeaderAction' };

type SetDataSetNameAction = { type: 'SetDataSetNameAction'; value: string };

type DoImportAction = { type: 'DoImportAction' };

type Action =
  | EncodingAction
  | FileSelectedAction
  | GotPreviewAction
  | BadImportFileAction
  | ToggleHeaderAction
  | SetDataSetNameAction
  | DoImportAction;

type HandleAction = (action: Action) => void;

class WbImport extends Component<{}, WbImportState> {
  constructor(props: any) {
    super(props);
    this.state = { type: 'ChooseFileState' };
  }

  generateCSVPreview(file: File, encoding: string) {
    Papa.parse(file, {
      encoding,
      preview: PREVIEW_SIZE,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const maxWidth = Math.max(...data.map((row) => row.length));
        data.forEach((row) =>
          row.push(...Array.from({ length: maxWidth - row.length }).fill(''))
        );
        this.update(
          data.length > 0
            ? { type: 'GotPreviewAction', preview: data, file, fileType: 'csv' }
            : { type: 'BadImportFileAction', file, fileType: 'csv' }
        );
      },
    });
  }

  generateXLSPreview(file: File) {
    const worker = new ImportXLSWorker();
    worker.postMessage({ file, previewSize: PREVIEW_SIZE });
    worker.onmessage = ({ data }) =>
      this.update(
        data.length > 0
          ? { type: 'GotPreviewAction', preview: data, file, fileType: 'xls' }
          : { type: 'BadImportFileAction', file, fileType: 'xls' }
      );
    worker.addEventListener('error', () =>
      this.update({ type: 'BadImportFileAction', file, fileType: 'xls' })
    );
  }

  doImportCSV(file: File, name: string, hasHeader: boolean, encoding: string) {
    const doIt = () =>
      Papa.parse(file, {
        encoding,
        skipEmptyLines: true,
        complete: ({ data }) => {
          const { rows, header } = extractHeader(data, hasHeader);
          this.createDataset(name, header, rows, file.name);
        },
      });

    setTimeout(doIt, 0);
  }

  doImportXLS(file: File, name: string, hasHeader: boolean) {
    const worker = new ImportXLSWorker();
    worker.postMessage({ file, previewSize: null });
    worker.onmessage = ({ data }) => {
      const { rows, header } = extractHeader(data, hasHeader);
      this.createDataset(name, header, rows, file.name);
    };
  }

  createDataset(
    name: string,
    header: string[],
    data: string[][],
    filename: string
  ) {
    uniquifyDataSetName(name)
      .then(async (name) =>
        ajax<Dataset>(
          '/api/workbench/dataset/',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
            },
            body: {
              name,
              importedfilename: filename,
              columns: header,
              rows: data,
            },
          },
          { expectedResponseCodes: [Http.CREATED] }
        )
      )
      .then(({ data: { id } }) => {
        navigation.go(`/workbench/${id}/`);
      });
  }

  update(action: Action) {
    const setState = (s: WbImportState) => {
      this.setState(s);
    };

    switch (action.type) {
      case 'EncodingAction':
        if ('encoding' in this.state && this.state.fileType === 'csv') {
          setState({ ...this.state, encoding: action.encoding });
          this.generateCSVPreview(this.state.file, this.state.encoding);
        }
        break;

      case 'FileSelectedAction':
        if (action.fileType === 'csv')
          this.generateCSVPreview(
            action.file,
            'encoding' in this.state ? this.state.encoding : 'utf-8'
          );
        else this.generateXLSPreview(action.file);
        break;

      case 'GotPreviewAction':
        setState({
          type: 'PreviewFileState',
          preview: action.preview,
          file: action.file,
          fileType: action.fileType,
          // Remove extension
          datasetName: action.file.name.replace(/\.[^.]*$/, ''),
          encoding: 'encoding' in this.state ? this.state.encoding : 'utf-8',
          hasHeader: true,
        });
        break;

      case 'BadImportFileAction':
        setState({
          type: 'BadFileState',
          file: action.file,
          fileType: action.fileType,
          encoding: 'encoding' in this.state ? this.state.encoding : 'utf-8',
        });
        break;

      case 'ToggleHeaderAction':
        if (this.state.type === 'PreviewFileState')
          setState({ ...this.state, hasHeader: !this.state.hasHeader });
        break;

      case 'SetDataSetNameAction':
        if (this.state.type === 'PreviewFileState')
          setState({ ...this.state, datasetName: action.value });
        break;

      case 'DoImportAction':
        if (this.state.type !== 'PreviewFileState') break;
        if (this.state.fileType === 'csv') {
          setState({
            type: 'LoadingFileState',
            file: this.state.file,
            fileType: this.state.fileType,
            datasetName: this.state.datasetName,
          });
          this.doImportCSV(
            this.state.file,
            this.state.datasetName,
            this.state.hasHeader,
            this.state.encoding
          );
        } else {
          setState({
            type: 'LoadingFileState',
            file: this.state.file,
            fileType: this.state.fileType,
            datasetName: this.state.datasetName,
          });
          this.doImportXLS(
            this.state.file,
            this.state.datasetName,
            this.state.hasHeader
          );
        }
        break;

      default:
        assertExhaustive(action);
    }
  }

  render() {
    const update = (action: Action) => this.update(action);

    let rows;
    let ui;
    let preview;
    switch (this.state.type) {
      case 'ChooseFileState':
        rows = <ChooseFile update={update} />;
        break;

      case 'PreviewFileState':
        rows = (
          <>
            <ChooseFile update={update} />
            {this.state.fileType === 'csv' && (
              <ChooseEncoding encoding={this.state.encoding} update={update} />
            )}
            <ChooseName name={this.state.datasetName} update={update} />
            <ToggleHeader hasHeader={this.state.hasHeader} update={update} />
          </>
        );
        ui = (
          <div>
            <DoImportButton update={update} />
          </div>
        );
        preview = (
          <Preview data={this.state.preview} hasHeader={this.state.hasHeader} />
        );
        break;

      case 'BadFileState':
        rows = (
          <>
            <ChooseFile update={update} />
            {this.state.fileType === 'csv' && (
              <ChooseEncoding encoding={this.state.encoding} update={update} />
            )}
            <p role="alert">{wbText('corruptFile')(this.state.file.name)}</p>
          </>
        );
        break;

      case 'LoadingFileState':
        break;

      default:
        assertExhaustive(this.state);
    }

    return (
      <Container.Full>
        <div className="gap-y-2 flex flex-col">
          <H2>{wbText('wbImportHeader')}</H2>
          <div
            className={`gap-2 grid grid-cols-2 items-center min-w-[275px]
            w-2/5 wb-import-table`}
          >
            {rows}
          </div>
          {ui}
        </div>
        {preview}
      </Container.Full>
    );
  }
}

function ChooseEncoding(props: {
  encoding: string | null;
  update: HandleAction;
}) {
  return (
    <label className="contents">
      {wbText('characterEncoding')}
      <Select
        onValueChange={(value): void =>
          props.update({
            type: 'EncodingAction',
            encoding: value,
          })
        }
        value={props.encoding ?? ''}
      >
        {encodings.map((encoding: string) => (
          <option key={encoding}>{encoding}</option>
        ))}
      </Select>
    </label>
  );
}

const fileMimeMapper: IR<FileType> = {
  'text/csv': 'csv',
  'text/tab-separated-values': 'csv',
  'text/plain': 'csv',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xls',
};

function ChooseFile(props: { update: HandleAction }) {
  return (
    <FilePicker
      onSelected={(file) =>
        props.update({
          type: 'FileSelectedAction',
          file,
          fileType: fileMimeMapper[file.type] ?? 'xls',
        })
      }
      acceptedFormats={['.csv', '.tsv', '.txt', '.xls', '.xlsx']}
    />
  );
}

function Preview({
  data,
  hasHeader,
}: {
  data: string[][];
  hasHeader: boolean;
}) {
  const { rows, header } = extractHeader(data, hasHeader);

  return (
    <div>
      <H3>{wbText('previewDataSet')}</H3>
      <div className="overflow-auto">
        <table>
          <thead>
            <tr className="dark:bg-neutral-700 text-center bg-gray-500">
              {header.map((cell, index) => (
                <th
                  key={index}
                  scope="col"
                  className="dark:border-gray-500 p-1 border border-gray-700"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, index) => (
                  <td key={index} className={`border border-gray-500`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChooseName({
  name,
  update,
}: {
  readonly name: string;
  readonly update: HandleAction;
}): JSX.Element {
  return (
    <label className="contents">
      {wbText('chooseDataSetName')}
      <Input.Text
        spellCheck={true}
        value={name}
        required
        maxLength={256}
        onValueChange={(value) =>
          update({
            type: 'SetDataSetNameAction',
            value,
          })
        }
      />
    </label>
  );
}

function ToggleHeader(props: { hasHeader: boolean; update: HandleAction }) {
  return (
    <label className="contents">
      {wbText('firstRowIsHeader')}
      <span>
        <Input.Checkbox
          onChange={(): void => props.update({ type: 'ToggleHeaderAction' })}
          checked={props.hasHeader}
        />
      </span>
    </label>
  );
}

function DoImportButton(props: { update: HandleAction }) {
  return (
    <Button.Simple
      onClick={(): void => props.update({ type: 'DoImportAction' })}
    >
      {wbText('importFile')}
    </Button.Simple>
  );
}

function extractHeader(
  data: string[][],
  headerInData: boolean
): { rows: string[][]; header: string[] } {
  const header = headerInData
    ? uniquifyHeaders(data[0].map(f.trim))
    : Array.from(data[0], (_, index) => wbText('columnName')(index + 1));
  const rows = headerInData ? data.slice(1) : data;
  return { rows, header: Array.from(header) };
}

function assertExhaustive(x: never): never {
  throw new Error(`Non-exhaustive switch. Unhandled case:${x}`);
}

export default createBackboneView(function WbImportView() {
  useTitle(wbText('importDataSet'));
  return <WbImport />;
});
