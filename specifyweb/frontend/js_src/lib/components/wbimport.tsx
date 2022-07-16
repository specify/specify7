/**
 * Data Set import page
 *
 * @module
 */

import React from 'react';

import { encodings } from '../encodings';
import { wbText } from '../localization/workbench';
import type { RA } from '../types';
import {
  createDataSet,
  extractFileName,
  extractHeader,
  getMaxDataSetLength,
  inferDataSetType,
  parseCsv,
  parseXls,
  wbImportPreviewSize,
} from '../wbimporthelpers';
import { Button, Container, H2, H3, Input, Select } from './basic';
import { LoadingContext } from './contexts';
import { FilePicker } from './filepicker';
import { useAsyncState, useTitle, useTriggerState } from './hooks';
import { loadingGif } from './common';
import { useCachedState } from './statecache';

export function WbImportView(): JSX.Element {
  useTitle(wbText('importDataSet'));

  const [file, setFile] = React.useState<File | undefined>();

  return (
    <Container.Full>
      <H2>{wbText('wbImportHeader')}</H2>
      <div className="w-96">
        <FilePicker
          onSelected={setFile}
          acceptedFormats={['.csv', '.tsv', '.psv', '.txt', '.xls', '.xlsx']}
        />
      </div>
      {typeof file === 'object' && <FilePicked file={file} />}
    </Container.Full>
  );
}

function FilePicked({ file }: { readonly file: File }): JSX.Element {
  const fileType = inferDataSetType(file);

  return fileType === 'csv' ? (
    <CsvPicked file={file} />
  ) : (
    <XlsPicked file={file} />
  );
}

function CsvPicked({ file }: { readonly file: File }): JSX.Element {
  const [encoding, setEncoding] = React.useState<string>('utf-8');
  const preview = useCsvPreview(file, encoding);
  const loading = React.useContext(LoadingContext);
  return (
    <Layout
      fileName={file.name}
      preview={preview}
      onImport={(dataSetName, hasHeader): void =>
        loading(
          parseCsv(file, encoding).then(async (data) =>
            createDataSet({ dataSetName, fileName: file.name, hasHeader, data })
          )
        )
      }
    >
      <ChooseEncoding encoding={encoding} onChange={setEncoding} />
    </Layout>
  );
}

function useCsvPreview(
  file: File,
  encoding: string
): RA<RA<string>> | string | undefined {
  const [preview] = useAsyncState<RA<RA<string>> | string>(
    React.useCallback(
      async () =>
        parseCsv(file, encoding, wbImportPreviewSize).catch(
          (error) => error.message
        ),
      [file, encoding]
    ),
    false
  );
  return preview;
}

function ChooseEncoding({
  encoding,
  onChange: handleChange,
}: {
  readonly encoding: string;
  readonly onChange: (encoding: string) => void;
}): JSX.Element {
  return (
    <label className="contents">
      {wbText('characterEncoding')}
      <Select onValueChange={handleChange} value={encoding ?? ''}>
        {encodings.map((encoding: string) => (
          <option key={encoding}>{encoding}</option>
        ))}
      </Select>
    </label>
  );
}

function Layout({
  fileName,
  preview,
  children,
  onImport: handleImport,
}: {
  readonly fileName: string;
  readonly preview: RA<RA<string>> | string | undefined;
  readonly children?: JSX.Element;
  readonly onImport: (dataSetName: string, hasHeader: boolean) => void;
}): JSX.Element {
  const [dataSetName, setDataSetName] = useTriggerState(
    extractFileName(fileName)
  );
  const [hasHeader = true, setHasHeader] = useCachedState(
    'wbImport',
    'hasHeader'
  );
  return typeof preview === 'string' ? (
    <BadImport error={preview} />
  ) : Array.isArray(preview) ? (
    <>
      <div className="w-96 grid items-center grid-cols-2 gap-2">
        {children}
        <ChooseName name={dataSetName} onChange={setDataSetName} />
        <ToggleHeader hasHeader={hasHeader} onChange={setHasHeader} />
        <Button.Gray
          onClick={(): void => handleImport(dataSetName, hasHeader)}
          className="col-span-full justify-center text-center"
        >
          {wbText('importFile')}
        </Button.Gray>
      </div>
      <Preview preview={preview} hasHeader={hasHeader} />
    </>
  ) : (
    loadingGif
  );
}

function ChooseName({
  name,
  onChange: handleChange,
}: {
  readonly name: string;
  readonly onChange: (name: string) => void;
}): JSX.Element {
  return (
    <label className="contents">
      {wbText('chooseDataSetName')}
      <Input.Text
        spellCheck={true}
        value={name}
        required
        maxLength={getMaxDataSetLength()}
        onValueChange={handleChange}
      />
    </label>
  );
}

function ToggleHeader({
  hasHeader,
  onChange: handleChange,
}: {
  readonly hasHeader: boolean;
  readonly onChange: (hasHeader: boolean) => void;
}): JSX.Element {
  return (
    <label className="contents">
      {wbText('firstRowIsHeader')}
      <span>
        <Input.Checkbox
          onChange={(): void => handleChange(!hasHeader)}
          checked={hasHeader}
        />
      </span>
    </label>
  );
}

function BadImport({ error }: { readonly error: string }): JSX.Element {
  return (
    <p role="alert">
      {wbText('errorImporting')}
      <br />
      {error}
    </p>
  );
}

function Preview({
  preview,
  hasHeader,
}: {
  readonly preview: RA<RA<string>>;
  readonly hasHeader: boolean;
}): JSX.Element {
  const { rows, header } = extractHeader(preview, hasHeader);

  return (
    <div>
      <H3>{wbText('previewDataSet')}</H3>
      <div className="overflow-auto">
        <table>
          <thead>
            <tr className="dark:bg-neutral-700 text-center bg-gray-200">
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

function XlsPicked({ file }: { readonly file: File }): JSX.Element {
  const preview = useXlsPreview(file);
  const loading = React.useContext(LoadingContext);
  return (
    <Layout
      preview={preview}
      fileName={file.name}
      onImport={(dataSetName, hasHeader): void =>
        loading(
          parseXls(file).then(async (data) =>
            createDataSet({ dataSetName, fileName: file.name, hasHeader, data })
          )
        )
      }
    />
  );
}

function useXlsPreview(file: File): RA<RA<string>> | string | undefined {
  const [preview] = useAsyncState<RA<RA<string>> | string>(
    React.useCallback(
      async () =>
        parseXls(file, wbImportPreviewSize).catch((error) => error.message),
      [file]
    ),
    false
  );
  return preview;
}
