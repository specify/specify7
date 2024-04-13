import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useStateForContext } from '../../hooks/useStateForContext';
import { useTriggerState } from '../../hooks/useTriggerState';
import { wbText } from '../../localization/workbench';
import type { GetOrSet, GetSet, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { Container, H2 } from '../Atoms';
import { Select } from '../Atoms/Form';
import { parseCsv, wbImportPreviewSize } from '../WbImport/helpers';
import { encodings } from '../WorkBench/encodings';
import type { AutoCompleteItem } from './AutoComplete';
import { AutoComplete } from './AutoComplete';
import { FilePicker, Layout } from './FilePicker';

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
    fileName,
  }: {
    readonly data: RA<RA<string>>;
    readonly hasHeader: boolean;
    readonly encoding: string;
    readonly getSetDelimiter: GetOrSet<string | undefined>;
    readonly fileName: string;
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
          onFileSelected={setFile}
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
    fileName,
  }: {
    readonly data: RA<RA<string>>;
    readonly hasHeader: boolean;
    readonly encoding: string;
    readonly getSetDelimiter: GetOrSet<string | undefined>;
    readonly fileName: string;
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
          console.error('Failed to parse data for File ', file.name);
          return;
        }
        handleFileImport({
          data: preview,
          hasHeader,
          encoding,
          getSetDelimiter,
          fileName: file.name,
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
        onCleared={(): void => setState(undefined)}
        onNewValue={handleChange}
      />
    </label>
  );
}
