/**
 * Data Set import page
 *
 * @module
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { useStateForContext } from '../../hooks/useStateForContext';
import { useTriggerState } from '../../hooks/useTriggerState';
import { wbText } from '../../localization/workbench';
import type { GetSet, RA } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Select } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import { useMenuItem } from '../Header';
import { loadingGif } from '../Molecules';
import type { AutoCompleteItem } from '../Molecules/AutoComplete';
import { AutoComplete } from '../Molecules/AutoComplete';
import { FilePicker } from '../Molecules/FilePicker';
import { encodings } from '../WorkBench/encodings';
import {
  createDataSet,
  extractFileName,
  extractHeader,
  getMaxDataSetLength,
  inferDataSetType,
  parseCsv,
  parseXls,
  wbImportPreviewSize,
} from './helpers';

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
  const getSetDelimiter = useStateForContext<string | undefined>(undefined);
  const preview = useCsvPreview(file, encoding, getSetDelimiter);
  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  return (
    <Layout
      fileName={file.name}
      preview={preview}
      onImport={(dataSetName, hasHeader): void =>
        loading(
          parseCsv(file, encoding, getSetDelimiter)
            .then(async (data) =>
              createDataSet({
                dataSetName,
                fileName: file.name,
                hasHeader,
                data,
              })
            )
            .then(({ id }) => navigate(`/specify/workbench/${id}/`))
        )
      }
    >
      <ChooseEncoding
        encoding={encoding}
        isDisabled={!Array.isArray(preview)}
        onChange={setEncoding}
      />
      <ChooseDelimiter
        isDisabled={!Array.isArray(preview)}
        getSetDelimiter={getSetDelimiter}
      />
    </Layout>
  );
}

function useCsvPreview(
  file: File,
  encoding: string,
  getSetDelimiter: GetSet<string | undefined>
): RA<RA<string>> | string | undefined {
  const [delimiter, setDelimiter] = getSetDelimiter;
  const [preview] = useAsyncState<RA<RA<string>> | string>(
    React.useCallback(
      async () =>
        parseCsv(
          file,
          encoding,
          [delimiter, setDelimiter],
          wbImportPreviewSize
        ).catch((error) => error.message),
      [file, encoding, delimiter, setDelimiter]
    ),
    false
  );
  return preview;
}

function ChooseEncoding({
  encoding = '',
  isDisabled,
  onChange: handleChange,
}: {
  readonly encoding: string;
  readonly isDisabled: boolean;
  readonly onChange: (encoding: string) => void;
}): JSX.Element {
  return (
    <label className="contents">
      {wbText('characterEncoding')}
      <Select
        disabled={isDisabled}
        value={encoding}
        onValueChange={handleChange}
      >
        {encodings.map((encoding: string) => (
          <option key={encoding}>{encoding}</option>
        ))}
      </Select>
    </label>
  );
}

const delimiters: RA<AutoCompleteItem<string>> = [
  { label: wbText('comma'), searchValue: ',', data: ',' },
  { label: wbText('tab'), searchValue: '\t', data: '\t' },
  { label: wbText('semicolon'), searchValue: ';', data: ';' },
  { label: wbText('space'), searchValue: ' ', data: ' ' },
  { label: wbText('pipe'), searchValue: '|', data: '|' },
];

function ChooseDelimiter({
  isDisabled,
  getSetDelimiter: [delimiter, handleChange],
}: {
  readonly isDisabled: boolean;
  readonly getSetDelimiter: GetSet<string | undefined>;
}): JSX.Element {
  const [state, setState] = useTriggerState<string | undefined>(delimiter);

  /**
   * Don't disable the component if it is currently focused, as disabling it
   * would lead to focus loss, which is bad UX and an accessibility issue.
   */
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const isFocused = inputRef.current === document.activeElement;
  const disabled = isDisabled && !isFocused;

  return (
    <label className="contents">
      {wbText('delimiter')}
      <AutoComplete<string>
        aria-label={undefined}
        delay={0}
        filterItems
        forwardRef={inputRef}
        disabled={disabled}
        inputProps={{
          onBlur: () => {
            if (state === undefined) handleChange(undefined);
          },
        }}
        minLength={0}
        source={delimiters}
        value={
          state ?? (state === delimiter ? wbText('determineAutomatically') : '')
        }
        onChange={({ data }): void => handleChange(data)}
        onCleared={(): void => {
          setState(undefined);
        }}
        onNewValue={handleChange}
      />
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
  readonly children?: JSX.Element | RA<JSX.Element>;
  readonly onImport: (dataSetName: string, hasHeader: boolean) => void;
}): JSX.Element {
  const [dataSetName, setDataSetName] = useTriggerState(
    extractFileName(fileName)
  );
  const [hasHeader = true, setHasHeader] = useCachedState(
    'wbImport',
    'hasHeader'
  );
  return (
    <>
      <div className="grid w-96 grid-cols-2 items-center gap-2">
        {children}
        <ChooseName name={dataSetName} onChange={setDataSetName} />
        <ToggleHeader
          hasHeader={hasHeader}
          isDisabled={preview === undefined}
          onChange={setHasHeader}
        />
        <Button.Gray
          className="col-span-full justify-center text-center"
          disabled={preview === undefined}
          onClick={(): void => handleImport(dataSetName, hasHeader)}
        >
          {wbText('importFile')}
        </Button.Gray>
      </div>
      {typeof preview === 'string' ? (
        <BadImport error={preview} />
      ) : Array.isArray(preview) ? (
        <Preview hasHeader={hasHeader} preview={preview} />
      ) : (
        loadingGif
      )}
    </>
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
  isDisabled,
  onChange: handleChange,
}: {
  readonly hasHeader: boolean;
  readonly isDisabled: boolean;
  readonly onChange: (hasHeader: boolean) => void;
}): JSX.Element {
  return (
    <label className="contents">
      {wbText('firstRowIsHeader')}
      <span>
        <Input.Checkbox
          checked={hasHeader}
          disabled={isDisabled}
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
            .then(({ id }) => navigate(`/specify/workbench/${id}/`))
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
