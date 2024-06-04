import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { localityText } from '../../localization/locality';
import { mainText } from '../../localization/main';
import { notificationsText } from '../../localization/notifications';
import { queryText } from '../../localization/query';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import type { IR, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { H2, Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Label } from '../Atoms/Form';
import { formatConjunction } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { SECOND } from '../Atoms/timeUnits';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import type { RecordSet, Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { useTitle } from '../Molecules/AppTitle';
import { CsvFilePicker } from '../Molecules/CsvFilePicker';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasToolPermission } from '../Permissions/helpers';
import { downloadDataSet } from '../WorkBench/helpers';
import { RemainingLoadingTime } from '../WorkBench/RemainingLoadingTime';
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

export function ImportLocalitySet(): JSX.Element {
  const [headerErrors, setHeaderErrors] = React.useState({
    missingRequiredHeaders: [] as RA<Header>,
    unrecognizedHeaders: [] as RA<string>,
  });

  const [headers, setHeaders] = React.useState<RA<string>>([]);
  const [taskId, setTaskId] = React.useState<string | undefined>(undefined);
  const [data, setData] = React.useState<RA<RA<number | string>>>([]);

  const loading = React.useContext(LoadingContext);

  function resetContext(): void {
    setHeaderErrors({
      missingRequiredHeaders: [] as RA<Header>,
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
        header={headerText.importLocalityDataset()}
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
              missingRequiredHeaders: Array.from(requiredHeaders),
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
      {taskId === undefined ? undefined : (
        <LocalityImportStatus
          taskId={taskId}
          onClose={() => setTaskId(undefined)}
        />
      )}
    </>
  );
}
type Status =
  | 'ABORTED'
  | 'FAILED'
  | 'PARSING'
  | 'PENDING'
  | 'PROGRESS'
  | 'SUCCEEDED';

const statusLocalization: { readonly [STATE in Status]: LocalizedString } = {
  PENDING: localityText.localityImportStarting(),
  PARSING: localityText.localityImportParsing(),
  PROGRESS: localityText.localityImportProgressing(),
  FAILED: localityText.localityImportFailed(),
  ABORTED: localityText.localityImportCancelled(),
  SUCCEEDED: localityText.localityImportSucceeded(),
};

type LocalityStatus =
  | State<
      'ABORTED',
      { readonly taskstatus: 'ABORTED'; readonly taskinfo: string }
    >
  | State<
      'FAILED',
      {
        readonly taskstatus: 'FAILED';
        readonly taskinfo: {
          readonly errors: RA<LocalityImportParseError>;
        };
      }
    >
  | State<
      'PARSING',
      {
        readonly taskstatus: 'PARSING';
        readonly taskinfo: {
          readonly current: number;
          readonly total: number;
        };
      }
    >
  | State<
      'PENDING',
      { readonly taskstatus: 'PENDING'; readonly taskinfo: 'None' }
    >
  | State<
      'PROGRESS',
      {
        readonly taskstatus: 'PROGRESS';
        readonly taskinfo: {
          readonly current: number;
          readonly total: number;
        };
      }
    >
  | State<
      'SUCCEEDED',
      {
        readonly taskstatus: 'SUCCEEDED';
        readonly taskinfo: {
          readonly recordsetid: number;
          readonly localities: RA<number>;
          readonly geocoorddetails: RA<number>;
        };
      }
    >;

const statusDimensionKey = 'localityimport-status';

function LocalityImportStatus({
  taskId,
  onClose: handleClose,
}: {
  readonly taskId: string;
  readonly onClose: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<LocalityStatus>({
    taskstatus: 'PENDING',
    type: 'PENDING',
    taskinfo: 'None',
  });

  const [recordSet, setRecordSet] = React.useState<
    SerializedResource<RecordSet> | undefined
  >(undefined);

  React.useEffect(() => {
    let destructorCalled = false;
    const fetchStatus = () =>
      void ajax<LocalityStatus>(`/api/localityset/status/${taskId}`, {
        headers: { Accept: 'application/json' },
      })
        .then(async ({ data }) => {
          setState(data);
          if (data.taskstatus === 'SUCCEEDED') {
            await fetchResource('RecordSet', data.taskinfo.recordsetid).then(
              setRecordSet
            );
          }
          if (
            !destructorCalled &&
            (['PROGRESS', 'PARSING', 'PENDING'] as RA<Status>).includes(
              data.taskstatus
            )
          )
            globalThis.setTimeout(fetchStatus, SECOND);
        })
        .catch(softFail);

    fetchStatus();
    return (): void => {
      destructorCalled = true;
    };
  }, [taskId]);

  const loading = React.useContext(LoadingContext);

  const title = statusLocalization[state.taskstatus];
  useTitle(title);

  return (['PARSING', 'PROGRESS'] as RA<Status>).includes(state.taskstatus) ? (
    <LocalityImportProgress
      currentProgress={state.taskinfo.current}
      header={title}
      taskId={taskId}
      total={state.taskinfo.total}
      onClose={handleClose}
    />
  ) : state.taskstatus === 'SUCCEEDED' ? (
    <LocalityImportSuccess
      geoCoordDetailIds={state.taskinfo.geocoorddetails}
      header={title}
      localityIds={state.taskinfo.localities}
      recordSet={recordSet}
      onClose={handleClose}
    />
  ) : state.taskstatus === 'FAILED' ? (
    <LocalityImportErrors
      errors={state.taskinfo.errors}
      onClose={handleClose}
    />
  ) : state.taskstatus === 'PENDING' ? (
    <Dialog
      buttons={
        <Button.Danger
          onClick={(): void =>
            loading(
              ping(`/api/localityset/abort/${taskId}`, {
                method: 'POST',
              }).catch(softFail)
            )
          }
        >
          {commonText.cancel()}
        </Button.Danger>
      }
      dimensionsKey={statusDimensionKey}
      header={title}
      modal={false}
      onClose={handleClose}
    />
  ) : (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      dimensionsKey={statusDimensionKey}
      header={title}
      modal={false}
      onClose={handleClose}
    />
  );
}

function LocalityImportProgress({
  header,
  taskId,
  currentProgress,
  total,
  onClose: handleClose,
}: {
  readonly header: LocalizedString;
  readonly taskId: string;
  readonly currentProgress: number;
  readonly total: number;
  readonly onClose: () => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const percentage = Math.round((currentProgress / total) * 100);
  useTitle(localized(`${header} ${percentage}%`));
  return (
    <Dialog
      buttons={
        <Button.Danger
          onClick={(): void =>
            loading(
              ping(`/api/localityset/abort/${taskId}`, {
                method: 'POST',
              }).catch(softFail)
            )
          }
        >
          {commonText.cancel()}
        </Button.Danger>
      }
      dimensionsKey={statusDimensionKey}
      header={header}
      modal={false}
      onClose={handleClose}
    >
      <Label.Block>
        <>
          <Progress max={total} value={currentProgress} />
          {percentage < 100 && <p>{`${percentage}%`}</p>}
          <RemainingLoadingTime current={currentProgress} total={total} />
        </>
      </Label.Block>
    </Dialog>
  );
}

function LocalityImportSuccess({
  header,
  localityIds,
  geoCoordDetailIds,
  recordSet,
  onClose: handleClose,
}: {
  readonly header: LocalizedString;
  readonly localityIds: RA<number>;
  readonly geoCoordDetailIds: RA<number>;
  readonly recordSet: SerializedResource<RecordSet> | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      dimensionsKey={statusDimensionKey}
      header={header}
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
            locality: localityIds.length,
            geocoorddetail: geoCoordDetailIds.length,
          }}
        />
      </div>
      <span className="gap-y-2" />
      <H2>{queryText.viewRecords()}</H2>
      {recordSet !== undefined && hasToolPermission('recordSets', 'read') && (
        <Link.NewTab
          className="w-fit"
          href={`/specify/record-set/${recordSet.id}/`}
        >
          <TableIcon label name={tables.Locality.name} />
          {localized(recordSet.name)}
        </Link.NewTab>
      )}
    </Dialog>
  );
}

function LocalityImportErrors({
  errors,
  onClose: handleClose,
}: {
  readonly errors: RA<LocalityImportParseError>;
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

              const data = errors.map(
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
      dimensionsKey={statusDimensionKey}
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
        {errors.map(({ rowNumber, field, message, payload }, index) => (
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
