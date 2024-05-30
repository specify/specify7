import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { localityText } from '../../localization/locality';
import { mainText } from '../../localization/main';
import { notificationsText } from '../../localization/notifications';
import { queryText } from '../../localization/query';
import { schemaText } from '../../localization/schema';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { IR, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { formatConjunction } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import { createResource } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import type { RecordSet, Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { CsvFilePicker } from '../Molecules/CsvFilePicker';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasToolPermission } from '../Permissions/helpers';
import { downloadDataSet } from '../WorkBench/helpers';
import { TableRecordCounts } from '../WorkBench/Results';
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
  readonly field: string;
  readonly payload: IR<unknown>;
  readonly rowNumber: number;
};

type LocalityUploadResponse =
  | {
      readonly type: 'ParseError';
      readonly errors: RA<LocalityImportParseError>;
    }
  | {
      readonly type: 'Uploaded';
      readonly localities: RA<number>;
      readonly geocoorddetails: RA<number>;
    };

export function ImportLocalitySet(): JSX.Element {
  const [headerErrors, setHeaderErrors] = React.useState({
    missingRequiredHeaders: [] as RA<Header>,
    unrecognizedHeaders: [] as RA<string>,
  });

  const [headers, setHeaders] = React.useState<RA<string>>([]);
  const [data, setData] = React.useState<RA<RA<number | string>>>([]);
  const [results, setResults] = React.useState<
    LocalityUploadResponse | undefined
  >(undefined);
  const [recordSet, setRecordSet] = React.useState<
    SerializedResource<RecordSet> | undefined
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

  const handleImport = (
    columnHeaders: typeof headers,
    rows: typeof data
  ): void => {
    loading(
      ajax<LocalityUploadResponse>('/api/locality_set/import/', {
        headers: { Accept: 'application/json' },
        expectedErrors: [Http.UNPROCESSABLE],
        method: 'POST',
        body: {
          columnHeaders,
          data: rows,
        },
      })
        .then(async ({ data: rawData, status }) => {
          const data =
            status === 422 && typeof rawData === 'string'
              ? (JSON.parse(rawData) as LocalityUploadResponse)
              : rawData;

          return data.type === 'Uploaded'
            ? ([
                data,
                await createResource('RecordSet', {
                  name: `${new Date().toDateString()} Locality Repatriation Import`,
                  version: 1,
                  type: 0,
                  dbTableId: tables.Locality.tableId,
                  // @ts-expect-error
                  recordSetItems: data.localities.map((id) => ({
                    recordId: id,
                  })),
                }),
              ] as const)
            : ([data, undefined] as const);
        })
        .then(([data, recordSet]) => {
          setData([]);
          setResults(data);
          setRecordSet(recordSet);
        })
    );
  };

  return (
    <>
      <CsvFilePicker
        header={headerText.coGeImportDataset()}
        onFileImport={(headers, data): void => {
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
                Array.from(acceptedHeaders) as unknown as RA<LocalizedString>
              )}
            </p>
          </>
        </Dialog>
      )}
      {results === undefined ? null : (
        <LocalityImportResults
          results={results}
          recordSet={recordSet}
          onClose={resetContext}
        />
      )}
    </>
  );
}

function LocalityImportResults({
  results,
  recordSet,
  onClose: handleClose,
}: {
  readonly results: LocalityUploadResponse;
  readonly recordSet: SerializedResource<RecordSet> | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <>
      {results.type === 'ParseError' ? (
        <LocalityImportErrors results={results} onClose={handleClose} />
      ) : results.type === 'Uploaded' ? (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          header={wbText.uploadResults()}
          modal={false}
          onClose={handleClose}
        >
          <div className="flex flex-col gap-4">
            <p>
              {localityText.localityUploadedDescription({
                localityTabelLabel: tables.Locality.label,
                geoCoordDetailTableLabel: tables.GeoCoordDetail.label,
              })}
            </p>
            <span className="gap-3" />
            <TableRecordCounts
              recordCounts={{
                locality: results.localities.length,
                geocoorddetail: results.geocoorddetails.length,
              }}
            />
          </div>
          <span className="gap-y-2"></span>
          <H2>{queryText.viewRecords()}</H2>
          {recordSet !== undefined &&
            hasToolPermission('recordSets', 'create') && (
              <Link.NewTab
                className="w-fit"
                href={`/specify/record-set/${recordSet.id}/`}
              >
                <TableIcon label name={tables.Locality.name} />
                {localized(recordSet.name)}
              </Link.NewTab>
            )}
        </Dialog>
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
                schemaText.field(),
                mainText.errorMessage(),
              ];

              const data = results.errors.map(
                ({ message, payload, field, rowNumber }) => [
                  rowNumber.toString(),
                  field,
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
      <table className="grid-table grid-cols-[1fr_auto_auto] gap-1 gap-y-3 overflow-auto">
        <thead>
          <tr>
            <td>{localityText.rowNumber()}</td>
            <td>{schemaText.field()}</td>
            <td>{mainText.errorMessage()}</td>
          </tr>
        </thead>
        {results.errors.map(({ rowNumber, field, message, payload }, index) => (
          <tr key={index}>
            <td>{rowNumber}</td>
            <td>{field}</td>
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
