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
import { ProtectedAction } from '../Permissions/PermissionDenied';
import { LocalityUpdateStatus } from './Status';
import type { LocalityUpdateHeader } from './types';
import {
  localityUpdateAcceptedHeaders,
  localityUpdateRequiredHeaders,
} from './utils';

export function LocalityUpdateFromDataSet(): JSX.Element {
  const [headerErrors, setHeaderErrors] = React.useState({
    missingRequiredHeaders: [] as RA<LocalityUpdateHeader>,
    unrecognizedHeaders: [] as RA<string>,
  });

  const [headers, setHeaders] = React.useState<RA<string>>([]);
  const [taskId, setTaskId] = React.useState<string | undefined>(undefined);
  const [data, setData] = React.useState<RA<RA<number | string>>>([]);

  const loading = React.useContext(LoadingContext);

  function resetContext(): void {
    setHeaderErrors({
      missingRequiredHeaders: [] as RA<LocalityUpdateHeader>,
      unrecognizedHeaders: [] as RA<string>,
    });
    setHeaders([]);
  }

  function handleParse(
    columnHeaders: RA<string>,
    data: RA<RA<number | string>>
  ): void {
    loading(
      ajax('/api/localityset/parse/', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: {
          columnHeaders,
          data,
          createRecordSet: false,
          runInBackground: true,
        },
      }).then(({ data }) => setTaskId(data))
    );
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
          runInBackground: true,
        },
      }).then(({ data }) => setTaskId(data))
    );
  }

  return (
    <ProtectedAction action="%" resource="%">
      <CsvFilePicker
        firstRowAlwaysHeader
        header={headerText.localityUpdateTool()}
        onFileImport={(headers, data): void => {
          const foundHeaderErrors = headers.reduce(
            (accumulator, currentHeader) => {
              const parsedHeader = currentHeader
                .toLowerCase()
                .trim() as LocalityUpdateHeader;
              const isUnknown =
                !localityUpdateAcceptedHeaders().has(parsedHeader);

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
              missingRequiredHeaders: Array.from(localityUpdateRequiredHeaders),
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
            handleParse(headers, data);
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
                    handleParse(headers, data);
                    setHeaderErrors({
                      missingRequiredHeaders: [] as RA<LocalityUpdateHeader>,
                      unrecognizedHeaders: [] as RA<string>,
                    });
                  }}
                >
                  {commonText.import()}
                </Button.Small>
              )}
            </>
          }
          header={localityText.localityUpdateHeaderError()}
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
                <H2>{localityText.localityUpdateMissingHeader()}</H2>
                <p>
                  {formatConjunction(
                    headerErrors.missingRequiredHeaders as RA<LocalizedString>
                  )}
                </p>
              </>
            )}
            {headerErrors.unrecognizedHeaders.length > 0 && (
              <>
                <H2>{localityText.localityUpdateUnrecognizedHeaders()}</H2>
                <p>
                  {formatConjunction(
                    headerErrors.unrecognizedHeaders as RA<LocalizedString>
                  )}
                </p>
              </>
            )}
            <H2>{localityText.localityUpdateAcceptedHeaders()}</H2>
            <p>
              {formatConjunction(
                Array.from(
                  localityUpdateAcceptedHeaders()
                ) as unknown as RA<LocalizedString>
              )}
            </p>
          </>
        </Dialog>
      )}
      {taskId === undefined ? undefined : (
        <LocalityUpdateStatus
          taskId={taskId}
          onClose={(): void => setTaskId(undefined)}
          onImport={(): void => handleImport(headers, data)}
        />
      )}
    </ProtectedAction>
  );
}
