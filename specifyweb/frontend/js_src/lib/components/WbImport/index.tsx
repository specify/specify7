/**
 * Data Set import page
 *
 * @module
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { wbText } from '../../localization/workbench';
import type { GetOrSet, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { stripFileExtension } from '../../utils/utils';
import { Container, H2 } from '../Atoms';
import { Input } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import { useMenuItem } from '../Header/MenuContext';
import { CsvFilePreview } from '../Molecules/CsvFilePicker';
import { FilePicker, Layout } from '../Molecules/FilePicker';
import {
  createDataSet,
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
      <H2>{wbText.wbImportHeader()}</H2>
      <div className="w-96">
        <FilePicker
          acceptedFormats={['.csv', '.tsv', '.psv', '.txt', '.xls', '.xlsx']}
          onFileSelected={setFile}
        />
      </div>
      {typeof file === 'object' && <FilePicked file={file} />}
    </Container.Full>
  );
}

function FilePicked({ file }: { readonly file: File }): JSX.Element {
  const fileType = inferDataSetType(file);
  const getSetDataSetName = useTriggerState(stripFileExtension(file.name));
  const [hasHeader = true, setHasHeader] = useCachedState(
    'wbImport',
    'hasHeader'
  );

  return fileType === 'csv' ? (
    <CsvPicked
      file={file}
      getSetDataSetName={getSetDataSetName}
      getSetHasHeader={[hasHeader, setHasHeader]}
    />
  ) : (
    <XlsPicked
      file={file}
      getSetDataSetName={getSetDataSetName}
      getSetHasHeader={[hasHeader, setHasHeader]}
    />
  );
}

function CsvPicked({
  file,
  getSetHasHeader: [hasHeader, setHasHeader],
  getSetDataSetName: [dataSetName, setDataSetName],
}: {
  readonly file: File;
  readonly getSetHasHeader: GetOrSet<boolean | undefined>;
  readonly getSetDataSetName: GetOrSet<string>;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  return (
    <CsvFilePreview
      file={file}
      getSetHasHeader={[hasHeader, setHasHeader]}
      onFileImport={({ hasHeader, encoding, getSetDelimiter }): void => {
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
        );
      }}
    >
      <ChooseName name={dataSetName} onChange={setDataSetName} />
    </CsvFilePreview>
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
      {wbText.chooseDataSetName()}
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

function XlsPicked({
  file,
  getSetHasHeader,
  getSetDataSetName: [dataSetName, setDataSetName],
}: {
  readonly file: File;
  readonly getSetHasHeader: GetOrSet<boolean | undefined>;
  readonly getSetDataSetName: GetOrSet<string>;
}): JSX.Element {
  const preview = useXlsPreview(file);
  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  return (
    <Layout
      getSetHasHeader={getSetHasHeader}
      preview={preview}
      onFileImport={(hasHeader): void =>
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
    >
      <ChooseName name={dataSetName} onChange={setDataSetName} />
    </Layout>
  );
}

function useXlsPreview(
  file: File
): LocalizedString | RA<RA<string>> | undefined {
  const [preview] = useAsyncState<LocalizedString | RA<RA<string>>>(
    React.useCallback(
      async () =>
        parseXls(file, wbImportPreviewSize).catch((error) =>
          localized(error.message)
        ),
      [file]
    ),
    false
  );
  return preview;
}
