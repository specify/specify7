import Papa from 'papaparse';
import React, { Component } from 'react';

import ImportXLSWorker from 'worker-loader!../wbimportxls.worker';
import { uniquifyHeaders } from '../wbplanviewhelper';

const $ = require('jquery');

const navigation = require('../navigation.js');
const uniquifyDataSetName = require('../wbuniquifyname.js');
const encodings = require('../encodings.js');

const PREVIEW_SIZE = 10;

type FileType = 'csv' | 'xls';

type FileTypeState = { type: 'FileTypeState' };

type ChooseCSVFileState = { type: 'ChooseCSVFileState'; encoding: string };

type ChooseXLSFileState = { type: 'ChooseXLSFileState' };

type PreviewCSVState = {
  type: 'PreviewCSVState';
  preview: string[][];
  file: File;
  encoding: string;
  datasetName: string;
  hasHeader: boolean;
};

type PreviewXLSState = {
  type: 'PreviewXLSState';
  preview: string[][];
  file: File;
  datasetName: string;
  hasHeader: boolean;
};

type BadCSVState = { type: 'BadCSVState'; file: File; encoding: string };

type BadXLSState = { type: 'BadXLSState'; file: File };

type LoadingFileState = {
  type: 'LoadingFileState';
  file: File;
  datasetName: string;
};

type WbImportState =
  | FileTypeState
  | ChooseCSVFileState
  | ChooseXLSFileState
  | PreviewCSVState
  | PreviewXLSState
  | BadCSVState
  | BadXLSState
  | LoadingFileState;

type FileTypeAction = { type: 'FileTypeAction'; fileType: FileType };

type EncodingAction = { type: 'EncodingAction'; encoding: string };

type FileSelectedAction = { type: 'FileSelectedAction'; file: File };

type GotPreviewAction = {
  type: 'GotPreviewAction';
  preview: string[][];
  file: File;
};

type BadImportFileAction = { type: 'BadImportFileAction'; file: File };

type ToggleHeaderAction = { type: 'ToggleHeaderAction' };

type SetDataSetNameAction = { type: 'SetDataSetNameAction'; value: string };

type DoImportAction = { type: 'DoImportAction' };

type Action =
  | FileTypeAction
  | EncodingAction
  | FileSelectedAction
  | GotPreviewAction
  | BadImportFileAction
  | ToggleHeaderAction
  | SetDataSetNameAction
  | DoImportAction;

type HandleAction = (action: Action) => void;

export default class WbImport extends Component<{}, WbImportState> {
  constructor(props: any) {
    super(props);
    this.state = { type: 'FileTypeState' };
  }

  generateCSVPreview(file: File, encoding: string) {
    Papa.parse(file, {
      encoding,
      preview: PREVIEW_SIZE,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const maxWidth = Math.max(...data.map((row) => row.length));
        data.forEach((row) => row.push(...new Array(maxWidth - row.length)));
        this.update(
          data.length > 0
            ? { type: 'GotPreviewAction', preview: data, file }
            : { type: 'BadImportFileAction', file }
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
          ? { type: 'GotPreviewAction', preview: data, file }
          : { type: 'BadImportFileAction', file }
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
      .then((name: string) =>
        $.ajax('/api/workbench/dataset/', {
          type: 'POST',
          data: JSON.stringify({
            name,
            importedfilename: filename,
            columns: header,
            rows: data,
          }),
          contentType: 'application/json',
          processData: false,
        })
      )
      .done(({ id }: { id: number }) => {
        navigation.go(`/workbench/${id}/`);
      });
  }

  update(action: Action) {
    const setState = (s: WbImportState) => {
      this.setState(s);
    };

    switch (action.type) {
      case 'FileTypeAction':
        switch (action.fileType) {
          case 'xls':
            setState({ type: 'ChooseXLSFileState' });
            break;
          case 'csv':
            setState({ type: 'ChooseCSVFileState', encoding: 'utf-8' });
            break;
          default:
            assertExhaustive(action.fileType);
        }
        break;

      case 'EncodingAction':
        switch (this.state.type) {
          case 'ChooseCSVFileState':
            setState({ type: 'ChooseCSVFileState', encoding: action.encoding });
            break;

          case 'PreviewCSVState':
            setState({ type: 'ChooseCSVFileState', encoding: action.encoding });
            this.generateCSVPreview(this.state.file, this.state.encoding);
            break;
        }
        break;

      case 'FileSelectedAction':
        switch (this.state.type) {
          case 'ChooseCSVFileState':
          case 'PreviewCSVState':
          case 'BadCSVState':
            this.generateCSVPreview(action.file, this.state.encoding);
            break;

          case 'ChooseXLSFileState':
          case 'PreviewXLSState':
          case 'BadXLSState':
            this.generateXLSPreview(action.file);
            break;
        }
        break;

      case 'GotPreviewAction':
        switch (this.state.type) {
          case 'ChooseCSVFileState':
          case 'PreviewCSVState':
          case 'BadCSVState':
            setState({
              type: 'PreviewCSVState',
              preview: action.preview,
              file: action.file,
              datasetName: action.file.name.replace(/\.[^.]*$/, ''), // Remove extentsion
              encoding: this.state.encoding,
              hasHeader: true,
            });
            break;

          case 'ChooseXLSFileState':
          case 'PreviewXLSState':
          case 'BadXLSState':
            setState({
              type: 'PreviewXLSState',
              preview: action.preview,
              file: action.file,
              datasetName: action.file.name.replace(/\.[^.]*$/, ''), // Remove extentsion
              hasHeader: true,
            });
            break;
        }
        break;

      case 'BadImportFileAction':
        switch (this.state.type) {
          case 'ChooseCSVFileState':
          case 'PreviewCSVState':
          case 'BadCSVState':
            setState({
              type: 'BadCSVState',
              file: action.file,
              encoding: this.state.encoding,
            });
            break;

          case 'ChooseXLSFileState':
          case 'PreviewXLSState':
          case 'BadXLSState':
            setState({ type: 'BadXLSState', file: action.file });
            break;
        }
        break;

      case 'ToggleHeaderAction':
        switch (this.state.type) {
          case 'PreviewCSVState':
          case 'PreviewXLSState':
            setState({ ...this.state, hasHeader: !this.state.hasHeader });
            break;
        }
        break;

      case 'SetDataSetNameAction':
        switch (this.state.type) {
          case 'PreviewCSVState':
          case 'PreviewXLSState':
            setState({ ...this.state, datasetName: action.value });
            break;
        }
        break;

      case 'DoImportAction':
        switch (this.state.type) {
          case 'PreviewCSVState':
            setState({
              type: 'LoadingFileState',
              file: this.state.file,
              datasetName: this.state.datasetName,
            });
            this.doImportCSV(
              this.state.file,
              this.state.datasetName,
              this.state.hasHeader,
              this.state.encoding
            );
            break;

          case 'PreviewXLSState':
            setState({
              type: 'LoadingFileState',
              file: this.state.file,
              datasetName: this.state.datasetName,
            });
            this.doImportXLS(
              this.state.file,
              this.state.datasetName,
              this.state.hasHeader
            );
            break;
        }
        break;

      default:
        assertExhaustive(action);
    }
  }

  render() {
    const update = (action: Action) => this.update(action);

    let ui;
    switch (this.state.type) {
      case 'FileTypeState':
        ui = <SelectFileType fileType={null} update={update} />;
        break;

      case 'ChooseXLSFileState':
        ui = (
          <>
            <SelectFileType fileType="xls" update={update} />
            <ChooseFile fileType="xls" update={update} />
          </>
        );
        break;

      case 'ChooseCSVFileState':
        ui = (
          <>
            <SelectFileType fileType="csv" update={update} />
            <ChooseEncoding encoding={this.state.encoding} update={update} />
            <ChooseFile fileType="csv" update={update} />
          </>
        );
        break;

      case 'PreviewCSVState':
        ui = (
          <>
            <SelectFileType fileType="csv" update={update} />
            <ChooseEncoding encoding={this.state.encoding} update={update} />
            <ChooseFile fileType="csv" update={update} />
            <ToggleHeader hasHeader={this.state.hasHeader} update={update} />
            <ChooseName name={this.state.datasetName} update={update} />
            <DoImportButton update={update} />
            <h2>Preview Dataset</h2>
            <Preview
              data={this.state.preview}
              hasHeader={this.state.hasHeader}
            />
          </>
        );
        break;

      case 'BadCSVState':
        ui = (
          <>
            <SelectFileType fileType="csv" update={update} />
            <ChooseEncoding encoding={this.state.encoding} update={update} />
            <ChooseFile fileType="csv" update={update} />
            <p>
              The file {this.state.file.name} is corrupt or contains no data!
            </p>
          </>
        );
        break;

      case 'PreviewXLSState':
        ui = (
          <>
            <SelectFileType fileType="xls" update={update} />
            <ChooseFile fileType="xls" update={update} />
            <ToggleHeader hasHeader={this.state.hasHeader} update={update} />
            <ChooseName name={this.state.datasetName} update={update} />
            <DoImportButton update={update} />
            <h2>Preview Dataset</h2>
            <Preview
              data={this.state.preview}
              hasHeader={this.state.hasHeader}
            />
          </>
        );
        break;

      case 'BadXLSState':
        ui = (
          <>
            <SelectFileType fileType="xls" update={update} />
            <ChooseFile fileType="xls" update={update} />
            <p>
              The file {this.state.file.name} is corrupt or contains no data!
            </p>
          </>
        );
        break;

      case 'LoadingFileState':
        ui = (
          <>
            <h3>Processing...</h3>
            <p>
              The data from {this.state.file.name} is being imported into the
              Workbench as dataset {this.state.datasetName}. Do not close this
              page until the process is complete.
            </p>
          </>
        );
        break;

      default:
        assertExhaustive(this.state);
    }

    return (
      <div>
        <h2>Import Dataset</h2>
        {ui}
      </div>
    );
  }
}

function SelectFileType(props: {
  fileType: FileType | null;
  update: HandleAction;
}) {
  function selected(value: string) {
    if (value == 'csv' || value == 'xls') {
      props.update({ type: 'FileTypeAction', fileType: value });
    }
  }

  return (
    <p>
      <select
        onChange={(event) => selected(event.target.value)}
        value={props.fileType || ''}
      >
        <option>Choose File Type</option>
        <option value="xls">Excel</option>
        <option value="csv">CSV</option>
      </select>
    </p>
  );
}

function ChooseEncoding(props: {
  encoding: string | null;
  update: HandleAction;
}) {
  function selected(value: string) {
    props.update({ type: 'EncodingAction', encoding: value });
  }

  const options = encodings.allLabels.map((encoding: string) => (
    <option key={encoding}>{encoding}</option>
  ));

  return (
    <p>
      Character encoding:{' '}
      <select
        onChange={(event) => selected(event.target.value)}
        value={props.encoding || ''}
      >
        {options}
      </select>
    </p>
  );
}

function ChooseFile(props: { fileType: FileType; update: HandleAction }) {
  function changed(target: HTMLInputElement) {
    if (target.files && target.files[0]) {
      props.update({ type: 'FileSelectedAction', file: target.files[0] });
      setFileName(target.files[0].name);
      target.value = '';
    } else setFileName(undefined);
  }

  const [fileName, setFileName] = React.useState<string | undefined>(undefined);

  const extensions =
    props.fileType === 'csv'
      ? '.csv,.tsv,.txt'
      : props.fileType === 'xls'
      ? '.xls,.xlsx'
      : assertExhaustive(props.fileType);

  return (
    <p>
      <label className="custom-file-picker">
        <a
          tabIndex={0}
          className={`ui-button ui-widget ui-state-default ui-corner-all
            ui-button-text-only`}
        >
          <span className="ui-button-text">Choose {props.fileType} file</span>
        </a>
        <br />
        {fileName && <span>Chosen file: {fileName}</span>}
        <input
          type="file"
          accept={extensions}
          onChange={(event) => changed(event.target)}
        />
      </label>
    </p>
  );
}

function Preview(props: { data: string[][]; hasHeader: boolean }) {
  const hasHeader = props.hasHeader;
  const data = props.data;
  const { rows, header } = extractHeader(data, hasHeader);

  const headerCells = header.map((cell, index) => <th key={index}>{cell}</th>);
  const dataRows = rows.map((row, index) => (
    <tr key={index}>
      {row.map((cell, index) => (
        <td key={index}>{cell}</td>
      ))}
    </tr>
  ));

  return (
    <div className="preview-table-wrapper">
      <table>
        <thead>
          <tr className="header">{headerCells}</tr>
        </thead>
        <tbody>{dataRows}</tbody>
      </table>
    </div>
  );
}

function ChooseName(props: { name: string; update: HandleAction }) {
  return (
    <p>
      Name for new data set:{' '}
      <input
        type="text"
        value={props.name}
        onChange={(event) =>
          props.update({
            type: 'SetDataSetNameAction',
            value: event.target.value,
          })
        }
      />
    </p>
  );
}

function ToggleHeader(props: { hasHeader: boolean; update: HandleAction }) {
  return (
    <label>
      First row is header:{' '}
      <input
        type="checkbox"
        onChange={() => props.update({ type: 'ToggleHeaderAction' })}
        checked={props.hasHeader}
      />
    </label>
  );
}

function DoImportButton(props: { update: HandleAction }) {
  return (
    <button onClick={() => props.update({ type: 'DoImportAction' })}>
      Import
    </button>
  );
}

function extractHeader(
  data: string[][],
  headerInData: boolean
): { rows: string[][]; header: string[] } {
  const header = headerInData
    ? uniquifyHeaders(data[0].map((header) => header.trim()))
    : data[0].map((_1, index) => `Column ${index + 1}`);
  const rows = headerInData ? data.slice(1) : data;
  return { rows, header: [...header] };
}

function assertExhaustive(x: never): never {
  throw new Error(`Non-exhaustive switch. Unhandled case:${x}`);
}
