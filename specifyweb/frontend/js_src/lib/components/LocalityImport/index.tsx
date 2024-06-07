import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { localityText } from '../../localization/locality';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { formatConjunction } from '../Atoms/Internationalization';
import { LoadingContext } from '../Core/Contexts';
import { CsvFilePicker } from '../Molecules/CsvFilePicker';
import { Dialog } from '../Molecules/Dialog';
import { LocalityImportStatus } from './Status';
import type { LocalityImportHeader } from './types';
import {
  localityImportAcceptedHeaders,
  localityImportRequiredHeaders,
} from './utils';

export function ImportLocalityDataSet(): JSX.Element {
  const [headerErrors, setHeaderErrors] = React.useState({
    missingRequiredHeaders: [] as RA<LocalityImportHeader>,
    unrecognizedHeaders: [] as RA<string>,
  });

  const [headers, setHeaders] = React.useState<RA<string>>([]);
  const [taskId, setTaskId] = React.useState<string | undefined>(undefined);
  const [data, setData] = React.useState<RA<RA<number | string>>>([]);

  const loading = React.useContext(LoadingContext);

  function resetContext(): void {
    setHeaderErrors({
      missingRequiredHeaders: [] as RA<LocalityImportHeader>,
      unrecognizedHeaders: [] as RA<string>,
    });
    setHeaders([]);
  }

  function handleImport(
    columnHeaders: RA<string>,
    data: RA<RA<number | string>>
  ): void {
    loading(
      ajax('/api/localityset/import/', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: {
          columnHeaders,
          data,
          createRecordSet: true,
        },
      }).then(({ data }) => setTaskId(data))
    );
  }

  return (
    <>
      <CsvFilePicker
        firstRowAlwaysHeader
        header={headerText.importLocalityDataset()}
        onFileImport={(headers, data): void => {
          const foundHeaderErrors = headers.reduce(
            (accumulator, currentHeader) => {
              const parsedHeader = currentHeader
                .toLowerCase()
                .trim() as LocalityImportHeader;
              const isUnknown =
                !localityImportAcceptedHeaders().has(parsedHeader);

              return {
                missingRequiredHeaders:
                  accumulator.missingRequiredHeaders.filter(
                    (header) => header !== parsedHeader
                  ),
                unrecognizedHeaders: isUnknown
                  ? [...accumulator.unrecognizedHeaders, currentHeader]
                  : accumulator.unrecognizedHeaders,
              };
            },
            {
              missingRequiredHeaders: Array.from(localityImportRequiredHeaders),
              unrecognizedHeaders: [] as RA<string>,
            }
          );
          setHeaderErrors(foundHeaderErrors);
          setHeaders(headers);
          setData(data);

          if (
            !Object.values(foundHeaderErrors).some(
              (errors) => errors.length > 0
            )
          )
            handleImport(headers, data);
        }}
      />
      {Object.values(headerErrors).some((errors) => errors.length > 0) && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              {headerErrors.missingRequiredHeaders.length === 0 && (
                <Button.Small
                  onClick={(): void => {
                    const storedHeaders = headers;
                    const storedData = data;
                    handleImport(storedHeaders, storedData);
                    resetContext();
                  }}
                >
                  {commonText.import()}
                </Button.Small>
              )}
            </>
          }
          header={localityText.localityImportHeaderError()}
          icon={
            headerErrors.missingRequiredHeaders.length === 0
              ? 'warning'
              : 'error'
          }
          onClose={resetContext}
        >
          <>
            {headerErrors.missingRequiredHeaders.length > 0 && (
              <>
                <H2>{localityText.localityImportMissingHeader()}</H2>
                <p>
                  {formatConjunction(
                    headerErrors.missingRequiredHeaders as RA<LocalizedString>
                  )}
                </p>
              </>
            )}
            {headerErrors.unrecognizedHeaders.length > 0 && (
              <>
                <H2>{localityText.localityImportUnrecognizedHeaders()}</H2>
                <p>
                  {formatConjunction(
                    headerErrors.unrecognizedHeaders as RA<LocalizedString>
                  )}
                </p>
              </>
            )}
            <H2>{localityText.localityImportedAcceptedHeaders()}</H2>
            <p>
              {formatConjunction(
                Array.from(
                  localityImportAcceptedHeaders()
                ) as unknown as RA<LocalizedString>
              )}
            </p>
          </>
        </Dialog>
      )}
      {taskId === undefined ? undefined : (
        <LocalityImportStatus
          taskId={taskId}
          onClose={(): void => setTaskId(undefined)}
        />
      )}
    </>
  );
}
