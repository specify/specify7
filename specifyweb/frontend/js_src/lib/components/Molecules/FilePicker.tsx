import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useStateForContext } from '../../hooks/useStateForContext';
import { useTriggerState } from '../../hooks/useTriggerState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { GetOrSet, GetSet, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Select } from '../Atoms/Form';
import type { TagProps } from '../Atoms/wrapper';
import {
  extractHeader,
  parseCsv,
  wbImportPreviewSize,
} from '../WbImport/helpers';
import { encodings } from '../WorkBench/encodings';
import { loadingGif } from '.';
import type { AutoCompleteItem } from './AutoComplete';
import { AutoComplete } from './AutoComplete';
import { useDragDropFiles } from './useDragDropFiles';

export function FilePicker({
  acceptedFormats,
  id,
  name,
  showFileNames = true,
  containerClassName = 'h-44 w-full',
  disabled,
  ...rest
}: Pick<TagProps<'input'>, 'disabled'> & {
  readonly acceptedFormats: RA<string> | undefined;
  // Whether to automatically click on the file input as soon as rendered
  readonly id?: string;
  readonly name?: string;
  readonly showFileNames?: boolean;
  readonly containerClassName?: string;
} & (
    | { readonly onFileSelected: (file: File) => void }
    | { readonly onFilesSelected: (files: FileList) => void }
  )): JSX.Element {
  const allowMultiple = 'onFilesSelected' in rest;
  const filePickerButton = React.useRef<HTMLButtonElement>(null);
  function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    if (handleFileChange(event.target.files ?? undefined))
      event.target.value = '';
  }

  function handleFileChange(files: FileList | undefined): boolean {
    if (files !== undefined && files.length > 0) {
      if (allowMultiple) {
        rest.onFilesSelected(files);
        setFileName(attachmentsText.multipleFilesSelected());
      } else {
        rest.onFileSelected(files[0]);
        setFileName(files[0].name);
      }

      return true;
    } else {
      setFileName(undefined);
      return false;
    }
  }

  const [fileName, setFileName] = React.useState<string | undefined>(undefined);
  const [isFocused, handleFocus, handleBlur] = useBooleanState();

  const { isDragging, callbacks } = useDragDropFiles(
    handleFileChange,
    filePickerButton
  );
  return (
    <label
      className="contents"
      onBlur={handleBlur}
      onFocus={handleFocus}
      {...callbacks}
    >
      <input
        accept={acceptedFormats?.join(',')}
        className="sr-only"
        disabled={disabled}
        id={id}
        multiple={allowMultiple}
        name={name}
        required
        type="file"
        onChange={handleFileSelected}
      />
      <span
        className={`
          align-center flex justify-center text-center normal-case
          ${className.secondaryButton}
          ${className.niceButton}
          ${containerClassName}
          ${
            isDragging
              ? 'bg-white ring ring-brand-200 dark:bg-neutral-700 dark:ring-brand-400'
              : ''
          }
          ${isFocused ? '!ring ring-blue-500' : ''}
        `}
        ref={filePickerButton}
      >
        <span>
          {allowMultiple
            ? commonText.multipleFilePickerMessage()
            : commonText.filePickerMessage()}
          {showFileNames && typeof fileName === 'string' && (
            <>
              <br />
              <br />
              <b>
                {commonText.colonLine({
                  label: commonText.selectedFileName(),
                  value: fileName,
                })}
              </b>
            </>
          )}
        </span>
      </span>
    </label>
  );
}

/**
 * A hacky way to download a file on the front-end
 * May stop working in the future
 *
 * @remarks
 * This method worked before 2019:
 * https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
 * Now, it only works if link is inside the iframe, which is achieved with
 * help from this code:
 * https://stackoverflow.com/a/10433550/8584605
 *
 */
export const downloadFile = async (
  fileName: string,
  text: string
): Promise<void> =>
  new Promise((resolve) => {
    let fileDownloaded = false;
    const iframe = document.createElement('iframe');
    iframe.addEventListener('load', () => {
      if (iframe.contentWindow === null || fileDownloaded) return;
      const element = iframe.contentWindow.document.createElement('a');
      element.setAttribute(
        'href',
        `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
      );
      element.setAttribute('download', fileName);

      element.style.display = 'none';
      iframe.contentWindow.document.body.append(element);

      element.click();
      fileDownloaded = true;
      globalThis.setTimeout(() => {
        iframe.remove();
        resolve();
      }, 100);
    });
    const html = '<body></body>';
    document.body.append(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(html);
    iframe.contentWindow?.document.close();
  });

export const fileToText = async (
  file: File,
  encoding = 'utf-8'
): Promise<string> =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', ({ target }) =>
      typeof target?.result === 'string'
        ? resolve(target.result)
        : reject(new Error('File is not a text file'))
    );
    fileReader.addEventListener('error', () => reject(fileReader.error));
    fileReader.readAsText(file, encoding);
  });

export function CsvFilePicker({
  header,
  onFileImport: handleFileImport,
}: {
  readonly header: LocalizedString;
  readonly onFileImport: ({
    data,
    hasHeader,
    encoding,
    getSetDelimiter,
  }: {
    readonly data: RA<RA<string>>;
    readonly hasHeader: boolean;
    readonly encoding: string;
    readonly getSetDelimiter: GetOrSet<string | undefined>;
  }) => void;
}): JSX.Element {
  const [file, setFile] = React.useState<File | undefined>();
  const getSetHasHeader = useStateForContext<boolean | undefined>(true);

  return (
    <Container.Full>
      <H2>{header}</H2>
      <div className="w-96">
        <FilePicker
          acceptedFormats={['.csv', '.tsv', '.psv', '.txt']}
          onFileSelected={(file): void => setFile(file)}
        />
      </div>
      {typeof file === 'object' && (
        <CsvFilePreview
          file={file}
          getSetHasHeader={getSetHasHeader}
          onFileImport={handleFileImport}
        />
      )}
    </Container.Full>
  );
}

export function CsvFilePreview({
  file,
  getSetHasHeader,
  children,
  onFileImport: handleFileImport,
}: {
  readonly file: File;
  readonly getSetHasHeader: GetOrSet<boolean | undefined>;
  readonly children?: JSX.Element | undefined;
  readonly onFileImport: ({
    data,
    hasHeader,
    encoding,
    getSetDelimiter,
  }: {
    readonly data: RA<RA<string>>;
    readonly hasHeader: boolean;
    readonly encoding: string;
    readonly getSetDelimiter: GetOrSet<string | undefined>;
  }) => void;
}): JSX.Element {
  const [encoding, setEncoding] = React.useState<string>('utf-8');
  const getSetDelimiter = useStateForContext<string | undefined>(undefined);
  const preview = useCsvPreview(file, encoding, getSetDelimiter);

  return (
    <Layout
      getSetHasHeader={getSetHasHeader}
      preview={preview}
      onFileImport={(hasHeader): void => {
        if (!Array.isArray(preview)) {
          console.error('Failed to parse data for File ', file.name, preview);
          return;
        }
        handleFileImport({
          data: preview,
          hasHeader,
          encoding,
          getSetDelimiter,
        });
      }}
    >
      {children === undefined ? <></> : children}
      <ChooseEncoding
        encoding={encoding}
        isDisabled={!Array.isArray(preview)}
        onChange={setEncoding}
      />
      <ChooseDelimiter
        getSetDelimiter={getSetDelimiter}
        isDisabled={!Array.isArray(preview)}
      />
    </Layout>
  );
}

export function useCsvPreview(
  file: File,
  encoding: string,
  getSetDelimiter: GetSet<string | undefined>
): LocalizedString | RA<RA<string>> | undefined {
  const [delimiter, setDelimiter] = getSetDelimiter;
  const [preview] = useAsyncState<LocalizedString | RA<RA<string>>>(
    React.useCallback(
      async () =>
        parseCsv(
          file,
          encoding,
          [delimiter, setDelimiter],
          wbImportPreviewSize
        ).catch((error) => localized(error.message)),
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
      {wbText.characterEncoding()}
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

export const delimiters: RA<AutoCompleteItem<string>> = [
  { label: wbText.comma(), searchValue: ',', data: ',' },
  { label: wbText.tab(), searchValue: '\t', data: '\t' },
  { label: wbText.semicolon(), searchValue: ';', data: ';' },
  { label: wbText.space(), searchValue: ' ', data: ' ' },
  { label: wbText.pipe(), searchValue: '|', data: '|' },
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
      {wbText.delimiter()}
      <AutoComplete<string>
        aria-label={undefined}
        delay={0}
        disabled={disabled}
        filterItems
        forwardRef={inputRef}
        inputProps={{
          onBlur: (): void =>
            state === undefined ? handleChange(undefined) : undefined,
        }}
        minLength={0}
        source={delimiters}
        value={
          state ?? (state === delimiter ? wbText.determineAutomatically() : '')
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

export function Layout({
  preview,
  getSetHasHeader: [hasHeader = true, setHasHeader],
  children,
  onFileImport: handleFileImport,
}: {
  readonly preview: LocalizedString | RA<RA<string>> | undefined;
  readonly getSetHasHeader: GetOrSet<boolean | undefined>;
  readonly children?: JSX.Element | RA<JSX.Element>;
  readonly onFileImport: (hasHeader: boolean) => void;
}): JSX.Element {
  return (
    <>
      <div className="grid w-96 grid-cols-2 items-center gap-2">
        {children}
        <ToggleHeader
          hasHeader={hasHeader}
          isDisabled={preview === undefined}
          onChange={setHasHeader}
        />
        <Button.Secondary
          className="col-span-full justify-center text-center"
          disabled={preview === undefined}
          onClick={(): void => handleFileImport(hasHeader)}
        >
          {wbText.importFile()}
        </Button.Secondary>
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
      {wbText.firstRowIsHeader()}
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
      <H3>{wbText.previewDataSet()}</H3>
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

function BadImport({
  error,
}: {
  readonly error: LocalizedString;
}): JSX.Element {
  return (
    <p role="alert">
      {wbText.errorImporting()}
      <br />
      {error}
    </p>
  );
}
