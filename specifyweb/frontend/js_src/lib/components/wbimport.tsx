/**
 * Data Set import page
 *
 * @module
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

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
import { loadingGif } from './common';
import { LoadingContext } from './contexts';
import { FilePicker } from './filepicker';
import { useAsyncState, useTriggerState } from './hooks';
import { useCachedState } from './statecache';
import { useMenuItem } from './header';

export function WbImportView(): JSX.Element {
  useMenuItem('workBench');
  const [file, setFile] = React.useState<File | undefined>();

  return (
    <Container.Full>
      <H2>{wbText('wbImportHeader')}</H2>
      <div className="w-96">
        <FilePicker
          acceptedFormats={['.csv', '.tsv', '.psv', '.txt', '.xls', '.xlsx']}
          onSelected={setFile}
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
  const navigate = useNavigate();
  return (
    <Layout
      fileName={file.name}
      preview={preview}
      onImport={(dataSetName, hasHeader): void =>
        loading(
          parseCsv(file, encoding)
            .then(async (data) =>
              createDataSet({
                dataSetName,
                fileName: file.name,
                hasHeader,
                data,
              })
            )
            .then(({ id }) => navigate(`/workbench/${id}/`))
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
      <Select value={encoding ?? ''} onValueChange={handleChange}>
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
      <div className="grid w-96 grid-cols-2 items-center gap-2">
        {children}
        <ChooseName name={dataSetName} onChange={setDataSetName} />
        <ToggleHeader hasHeader={hasHeader} onChange={setHasHeader} />
        <Button.Gray
          className="col-span-full justify-center text-center"
          onClick={(): void => handleImport(dataSetName, hasHeader)}
        >
          {wbText('importFile')}
        </Button.Gray>
      </div>
      <Preview hasHeader={hasHeader} preview={preview} />
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
        maxLength={getMaxDataSetLength()}
        required
        spellCheck
        value={name}
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
          checked={hasHeader}
          onChange={(): void => handleChange(!hasHeader)}
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
            <tr className="bg-gray-200 text-center dark:bg-neutral-700">
              {header.map((cell, index) => (
                <th
                  className="border border-gray-700 p-1 dark:border-gray-500"
                  key={index}
                  scope="col"
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
                  <td className="border border-gray-500" key={index}>
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
  const navigate = useNavigate();
  return (
    <Layout
      fileName={file.name}
      preview={preview}
      onImport={(dataSetName, hasHeader): void =>
        loading(
          parseXls(file)
            .then(async (data) =>
              createDataSet({
                dataSetName,
                fileName: file.name,
                hasHeader,
                data,
              })
            )
            .then(({ id }) => navigate(`/workbench/${id}/`))
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
