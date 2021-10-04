import Papa from 'papaparse';
import React, { Component } from 'react';
import ImportXLSWorker from 'worker-loader!../wbimportxls.worker';
import wbText from '../localization/workbench';

import { uniquifyHeaders } from '../wbplanviewheaderhelper';
import { IR } from './wbplanview';

const $ = require('jquery');

const navigation = require('../navigation.js');
const uniquifyDataSetName = require('../wbuniquifyname.js');
const encodings = require('../encodings.js');

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

export default class WbImport extends Component<{}, WbImportState> {
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
    worker.onerror = () =>
      this.update({ type: 'BadImportFileAction', file, fileType: 'xls' });
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
      .done(({ id }: { readonly id: number }) => {
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
        rows = (
          <>
            <ChooseFile update={update} />
          </>
        );
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
          <>
            <br />
            <DoImportButton update={update} />
            <h2>{wbText('previewDataSet')}</h2>
          </>
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
      <>
        <div>
          <h2
            style={{
              paddingBottom: '0.5rem',
            }}
          >
            {wbText('wbImportHeader')}
          </h2>
          <div className="wb-import-table">{rows}</div>
          {ui}
        </div>
        {preview}
      </>
    );
  }
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
    <label>
      {wbText('characterEncoding')}
      <select
        onChange={(event) => selected(event.target.value)}
        value={props.encoding || ''}
      >
        {options}
      </select>
    </label>
  );
}

function ChooseFile(props: { update: HandleAction }) {
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const filePickerButton = React.useRef<HTMLButtonElement>(null);

  function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    if (handleFileChange(event.target.files?.[0])) event.target.value = '';
  }

  function handleFileDropped(event: React.DragEvent): void {
    const file = event.dataTransfer?.items?.[0].getAsFile() ?? undefined;
    handleFileChange(file);
    preventPropagation(event);
    setIsDragging(false);
  }

  function handleFileChange(file: File | undefined): boolean {
    if (file) {
      const fileMimeMapper: IR<FileType> = {
        'text/csv': 'csv',
        'text/tab-separated-values': 'csv',
        'text/plain': 'csv',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          'xls',
      };
      props.update({
        type: 'FileSelectedAction',
        file,
        fileType: fileMimeMapper[file.type] ?? 'xls',
      });
      setFileName(file.name);
      return true;
    } else {
      setFileName(undefined);
      return false;
    }
  }

  function handleDragEnter(event: React.DragEvent): void {
    setIsDragging(event.dataTransfer?.items?.length !== 0 ?? false);
    preventPropagation(event);
  }

  function handleDragLeave(event: React.DragEvent): void {
    if (
      event.relatedTarget === null ||
      filePickerButton.current === null ||
      event.target !== filePickerButton.current ||
      filePickerButton.current.contains(event.relatedTarget as Node)
    )
      return;
    setIsDragging(false);
    preventPropagation(event);
  }

  function preventPropagation(event: React.DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  const [fileName, setFileName] = React.useState<string | undefined>(undefined);

  return (
    <label
      className={`custom-file-picker ${
        isDragging ? 'custom-file-picker-dragging' : ''
      }`}
      onDrop={handleFileDropped}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={preventPropagation}
    >
      <input
        type="file"
        accept=".csv,.tsv,.txt,.xls,.xlsx"
        onChange={handleFileSelected}
        className="sr-only"
        style={{ opacity: 0 }}
      />
      <span
        ref={filePickerButton}
        style={{
          gridColumn: '1 / span 2',
        }}
        className="magic-button v-center"
      >
        <span>
          {wbText('filePickerMessage')}
          {typeof fileName !== 'undefined' && (
            <>
              <br />
              <br />
              <b>{wbText('selectedFileName')(fileName)}</b>
            </>
          )}
        </span>
      </span>
    </label>
  );
}

function Preview(props: { data: string[][]; hasHeader: boolean }) {
  const hasHeader = props.hasHeader;
  const data = props.data;
  const { rows, header } = extractHeader(data, hasHeader);

  const headerCells = header.map((cell, index) => <th key={index} scope="col">{cell}</th>);
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
    <label>
      {wbText('chooseDataSetName')}
      <input
        type="text"
        spellCheck={true}
        value={props.name}
        onChange={(event) =>
          props.update({
            type: 'SetDataSetNameAction',
            value: event.target.value,
          })
        }
      />
    </label>
  );
}

function ToggleHeader(props: { hasHeader: boolean; update: HandleAction }) {
  return (
    <label>
      {wbText('firstRowIsHeader')}
      <span>
        <input
          type="checkbox"
          onChange={() => props.update({ type: 'ToggleHeaderAction' })}
          checked={props.hasHeader}
        />
      </span>
    </label>
  );
}

function DoImportButton(props: { update: HandleAction }) {
  return (
    <button
      className="magic-button"
      onClick={() => props.update({ type: 'DoImportAction' })}
    >
      {wbText('importFile')}
    </button>
  );
}

function extractHeader(
  data: string[][],
  headerInData: boolean
): { rows: string[][]; header: string[] } {
  const header = headerInData
    ? uniquifyHeaders(data[0].map((header) => header.trim()))
    : Array.from(data[0], (_, index) => wbText('columnName')(index + 1));
  const rows = headerInData ? data.slice(1) : data;
  return { rows, header: Array.from(header) };
}

function assertExhaustive(x: never): never {
  throw new Error(`Non-exhaustive switch. Unhandled case:${x}`);
}
