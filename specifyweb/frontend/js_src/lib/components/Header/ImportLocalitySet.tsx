import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { localityText } from '../../localization/locality';
import { mainText } from '../../localization/main';
import { notificationsText } from '../../localization/notifications';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { formatConjunction } from '../Atoms/Internationalization';
import { LoadingContext } from '../Core/Contexts';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { CsvFilePicker } from '../Molecules/CsvFilePicker';
import { Dialog } from '../Molecules/Dialog';
import { ProtectedTool } from '../Permissions/PermissionDenied';
import { CreateRecordSet } from '../QueryBuilder/CreateRecordSet';
import { downloadDataSet } from '../WorkBench/helpers';
import { resolveBackendParsingMessage } from '../WorkBench/resultsParser';

type Header = Exclude<
  Lowercase<
    | keyof Tables['GeoCoordDetail']['fields']
    | keyof Tables['Locality']['fields']
  >,
  'locality'
>;

const acceptedLocalityFields: RA<
  Lowercase<keyof Tables['Locality']['fields']>
> = ['guid', 'datum', 'latitude1', 'longitude1'];

const acceptedHeaders = new Set([
  ...acceptedLocalityFields,
  ...tables.GeoCoordDetail.literalFields
    .map(({ name }) => name.toLowerCase())
    .filter((header) => header !== 'locality'),
]);

const requiredHeaders = new Set<Header>(['guid']);

type LocalityImportParseError = {
  readonly message: string;
  readonly payload: IR<unknown>;
  readonly rowNumber: number;
};

type LocalityUploadResponse =
  | {
      readonly type: 'ParseError';
      readonly data: RA<LocalityImportParseError>;
    }
  | {
      readonly type: 'Uploaded';
      readonly data: RA<number>;
    };

export function ImportLocalitySet(): JSX.Element {
  const [headerErrors, setHeaderErrors] = React.useState({
    missingRequiredHeaders: [] as RA<Header>,
    unrecognizedHeaders: [] as RA<string>,
  });

  const [headers, setHeaders] = React.useState<RA<string>>([]);
  const [data, setData] = React.useState<RA<RA<string>>>([]);
  const [results, setResults] = React.useState<
    LocalityUploadResponse | undefined
  >(undefined);

  const loading = React.useContext(LoadingContext);

  function resetContext(): void {
    setHeaderErrors({
      missingRequiredHeaders: [] as RA<Header>,
      unrecognizedHeaders: [] as RA<string>,
    });
    setHeaders([]);
    setData([]);
    setResults(undefined);
  }

  return (
    <>
      <CsvFilePicker
        header={headerText.coGeImportDataset()}
        onFileImport={({ data }): void => {
          const headers = data[0];
          const foundHeaderErrors = headers.reduce(
            (accumulator, currentHeader) => {
              const parsedHeader = currentHeader.toLowerCase().trim() as Header;
              const isUnknown = !acceptedHeaders.has(parsedHeader);

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
              missingRequiredHeaders: Array.from(requiredHeaders) as RA<Header>,
              unrecognizedHeaders: [] as RA<string>,
            }
          );
          setHeaderErrors(foundHeaderErrors);
          setHeaders(headers);
          setData(data.slice(1));
        }}
      />
      {Object.values(headerErrors).some((errors) => errors.length > 0) ? (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              {headerErrors.missingRequiredHeaders.length === 0 && (
                <Button.Small
                  onClick={(): void =>
                    loading(
                      ajax<LocalityUploadResponse>(
                        '/api/import/locality_set/',
                        {
                          headers: { Accept: 'application/json' },
                          body: {
                            columnHeaders: headers,
                            data,
                          },
                          method: 'POST',
                        }
                      ).then(({ data }) => setResults(data))
                    )
                  }
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
                Array.from(acceptedHeaders) as unknown as RA<LocalizedString>
              )}
            </p>
          </>
        </Dialog>
      ) : data.length > 0 &&
        !Object.values(headerErrors).some((errors) => errors.length > 0) ? (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          header={localityText.localityimportHeader()}
          onClose={resetContext}
        >
          <Button.Small
            onClick={(): void =>
              loading(
                ajax<LocalityUploadResponse>('/api/import/locality_set/', {
                  headers: { Accept: 'application/json' },
                  body: {
                    columnHeaders: headers,
                    data,
                  },
                  method: 'POST',
                }).then(({ data }) => {
                  setData([]);
                  setResults(data);
                })
              )
            }
          >
            {commonText.import()}
          </Button.Small>
        </Dialog>
      ) : null}
      {results === undefined ? null : (
        <LocalityImportResults results={results} onClose={resetContext} />
      )}
    </>
  );
}

function LocalityImportResults({
  results,
  onClose: handleClose,
}: {
  readonly results: LocalityUploadResponse;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <>
      {results.type === 'ParseError' ? (
        <LocalityImportErrors results={results} onClose={handleClose} />
      ) : results.type === 'Uploaded' ? (
        <RecordSelectorFromIds
          defaultIndex={0}
          dialog="nonModal"
          headerButtons={
            <ProtectedTool action="create" tool="recordSets">
              <CreateRecordSet
                baseTableName="Locality"
                recordIds={results.data}
              />
            </ProtectedTool>
          }
          ids={results.data}
          isDependent={false}
          newResource={undefined}
          table={tables.Locality}
          title={undefined}
          totalCount={results.data.length}
          onAdd={undefined}
          onClone={undefined}
          onClose={handleClose}
          onDelete={undefined}
          onSaved={f.void}
          onSlide={undefined}
        />
      ) : null}
    </>
  );
}

function LocalityImportErrors({
  results,
  onClose: handleClose,
}: {
  readonly results: Extract<
    LocalityUploadResponse,
    { readonly type: 'ParseError' }
  >;
  readonly onClose: () => void;
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Info
            onClick={(): void => {
              const fileName = `${localityText.localityImportErrorFileName({
                date: new Date().toDateString(),
              })}.csv`;

              const columns = [
                localityText.rowNumber(),
                mainText.errorMessage(),
              ];

              const data = results.data.map(
                ({ message, payload, rowNumber }) => [
                  rowNumber.toString(),
                  resolveImportLocalityErrorMessage(message, payload),
                ]
              );

              loading(
                downloadDataSet(fileName, data, columns, ',').catch(softFail)
              );
            }}
          >
            {notificationsText.download()}
          </Button.Info>
        </>
      }
      header={localityText.localityImportErrorDialogHeader()}
      icon="error"
      onClose={handleClose}
    >
      <table className="grid-table grid-cols-[1fr_auto] gap-1 gap-y-3 overflow-auto">
        <thead>
          <tr>
            <td>{localityText.rowNumber()}</td>
            <td>{mainText.errorMessage()}</td>
          </tr>
        </thead>
        {results.data.map(({ rowNumber, message, payload }, index) => (
          <tr key={index}>
            <td>{rowNumber}</td>
            <td>{resolveImportLocalityErrorMessage(message, payload)}</td>
          </tr>
        ))}
      </table>
    </Dialog>
  );
}

function resolveImportLocalityErrorMessage(
  key: string,
  payload: IR<unknown>
): LocalizedString {
  const baseParseResults = resolveBackendParsingMessage(key, payload);

  if (baseParseResults !== undefined) {
    return baseParseResults;
  } else if (key === 'guidHeaderNotProvided') {
    return localityText.guidHeaderNotProvided();
  } else if (key === 'noLocalityMatchingGuid') {
    return localityText.noLocalityMatchingGuid({
      guid: payload.guid as string,
    });
  } else if (key === 'multipleLocalitiesWithGuid') {
    return localityText.multipleLocalitiesWithGuid({
      guid: payload.guid as string,
      localityIds: (payload.localityIds as RA<number>).join(', '),
    });
  } else {
    return commonText.colonLine({
      label: key,
      value:
        Object.keys(payload).length === 0 ? '' : `${JSON.stringify(payload)}`,
    });
  }
}
