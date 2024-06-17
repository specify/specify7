import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { mainText } from '../../localization/main';
import { notificationsText } from '../../localization/notifications';
import { preferencesText } from '../../localization/preferences';
import { queryText } from '../../localization/query';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { H2, Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { SECOND } from '../Atoms/timeUnits';
import { LoadingContext } from '../Core/Contexts';
import { fetchResource } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import { softFail } from '../Errors/Crash';
import { produceStackTrace } from '../Errors/stackTrace';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { mergeCellBackground } from '../Merging/Header';
import { useTitle } from '../Molecules/AppTitle';
import { Dialog } from '../Molecules/Dialog';
import { downloadFile } from '../Molecules/FilePicker';
import { TableIcon } from '../Molecules/TableIcon';
import { hasToolPermission } from '../Permissions/helpers';
import { CreateRecordSet } from '../QueryBuilder/CreateRecordSet';
import { downloadDataSet } from '../WorkBench/helpers';
import { RemainingLoadingTime } from '../WorkBench/RemainingLoadingTime';
import { TableRecordCounts } from '../WorkBench/Results';
import type {
  LocalityImportParseError,
  LocalityImportState,
  LocalityImportTaskStatus,
} from './types';
import {
  localityImportStatusLocalization,
  resolveImportLocalityErrorMessage,
} from './utils';

const statusDimensionKey = 'localityimport-status';

export function LocalityImportStatus({
  taskId,
  onImport: handleImport,
  onClose: handleClose,
}: {
  readonly taskId: string;
  readonly onImport: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<LocalityImportState>({
    taskstatus: 'PENDING',
    type: 'PENDING',
    taskinfo: 'None',
  });

  React.useEffect(() => {
    let destructorCalled = false;
    const fetchStatus = () =>
      void ajax<LocalityImportState>(`/api/localityset/status/${taskId}/`, {
        headers: { Accept: 'application/json' },
      })
        .then(({ data }) => {
          setState(data);
          if (
            !destructorCalled &&
            (
              ['PENDING', 'PARSING', 'PROGRESS'] as RA<LocalityImportTaskStatus>
            ).includes(data.taskstatus)
          )
            globalThis.setTimeout(fetchStatus, SECOND);
        })
        .catch(softFail);

    fetchStatus();
    return (): void => {
      destructorCalled = true;
    };
  }, [taskId]);

  const handleTaskCancel = React.useCallback(
    () =>
      void ping(`/api/localityset/abort/${taskId}/`, {
        method: 'POST',
      }).catch(softFail),
    [taskId]
  );

  const title = localityImportStatusLocalization[state.taskstatus];
  useTitle(title);

  return state.taskstatus === 'PARSING' || state.taskstatus === 'PROGRESS' ? (
    <LocalityImportProgress
      currentProgress={state.taskinfo.current}
      header={title}
      total={state.taskinfo.total}
      onClose={handleClose}
      onTaskCancel={handleTaskCancel}
    />
  ) : state.taskstatus === 'SUCCEEDED' ? (
    <LocalityImportSuccess
      geoCoordDetailIds={state.taskinfo.geocoorddetails}
      localityIds={state.taskinfo.localities}
      recordSetId={state.taskinfo.recordsetid}
      onClose={handleClose}
    />
  ) : state.taskstatus === 'PARSED' ? (
    <LocalityImportParsed
      geoCoordDetails={
        state.taskinfo.rows.filter(
          ({ geocoorddetail }) => geocoorddetail !== null
        ).length
      }
      localities={state.taskinfo.rows.length}
      onClose={handleClose}
      onImport={handleImport}
    />
  ) : state.taskstatus === 'PARSE_FAILED' ? (
    <LocalityImportParseErrors
      errors={state.taskinfo.errors}
      onClose={handleClose}
    />
  ) : state.taskstatus === 'FAILED' ? (
    <LocalityImportFailed
      taskId={taskId}
      traceback={state.taskinfo.traceback}
      onClose={handleClose}
    />
  ) : state.taskstatus === 'PENDING' ? (
    <Dialog
      buttons={
        <Button.Danger onClick={handleTaskCancel}>
          {commonText.cancel()}
        </Button.Danger>
      }
      children={null}
      dimensionsKey={statusDimensionKey}
      header={title}
      modal={false}
      onClose={handleClose}
    />
  ) : state.taskstatus === 'ABORTED' ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      children={null}
      dimensionsKey={statusDimensionKey}
      header={title}
      modal={false}
      onClose={handleClose}
    />
  ) : (
    <Dialog
      buttons={
        <>
          <Button.Info
            onClick={(): void =>
              void downloadFile(
                `Locality Data Set ${taskId} Report - ${new Date().toJSON()}.txt`,
                produceStackTrace(state.taskinfo)
              )
            }
          >
            {commonText.downloadErrorMessage()}
          </Button.Info>
          <span className="-ml-4 flex-1" />
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      dimensionsKey={statusDimensionKey}
      header={localityText.localityImportWentWrong()}
      modal={false}
      onClose={handleClose}
    >
      <Label.Block>
        <p>{state.taskstatus}</p>
        {typeof state.taskinfo === 'object' ? (
          <Label.Block>
            {Object.entries(state.taskinfo).map(([key, message], index) => (
              <p key={index}>
                {commonText.colonLine({
                  label: key,
                  value: message,
                })}
              </p>
            ))}
          </Label.Block>
        ) : (
          <p>{state.taskinfo}</p>
        )}
      </Label.Block>
    </Dialog>
  );
}

function LocalityImportProgress({
  header,
  currentProgress,
  total,
  onClose: handleClose,
  onTaskCancel: handleTaskCancel,
}: {
  readonly header: LocalizedString;
  readonly currentProgress: number;
  readonly total: number;
  readonly onClose: () => void;
  readonly onTaskCancel: () => void;
}): JSX.Element {
  const percentage = Math.round((currentProgress / total) * 100);
  useTitle(localized(`${percentage}% ${header}`));
  return (
    <Dialog
      buttons={
        <Button.Danger onClick={handleTaskCancel}>
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

export function LocalityImportParsed({
  localities,
  geoCoordDetails,
  onImport: handleImport,
  onClose: handleClose,
}: {
  readonly localities: number;
  readonly geoCoordDetails: number;
  readonly onImport: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Info
            onClick={(): void => {
              handleClose();
              handleImport();
            }}
          >
            {commonText.import()}
          </Button.Info>
        </>
      }
      header={localityImportStatusLocalization.PARSED}
      modal={false}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-4">
        <p>
          {localityText.localityImportEffectCounts({
            localityTabelLabel: tables.Locality.label,
            geoCoordDetailTableLabel: tables.GeoCoordDetail.label,
          })}
        </p>
        <span className="gap-3" />
        <TableRecordCounts
          recordCounts={{
            locality: localities,
            geocoorddetail: geoCoordDetails,
          }}
        />
      </div>
    </Dialog>
  );
}

export function LocalityImportSuccess({
  localityIds,
  geoCoordDetailIds,
  recordSetId,
  onClose: handleClose,
}: {
  readonly localityIds: RA<number>;
  readonly geoCoordDetailIds: RA<number>;
  readonly recordSetId: number | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const [recordSet] = useAsyncState(
    React.useCallback(
      async () =>
        recordSetId === undefined
          ? undefined
          : fetchResource('RecordSet', recordSetId, false),
      [recordSetId]
    ),
    false
  );

  const [formsOpened, handleFormsOpened, handleFormsClosed] = useBooleanState();

  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={localityImportStatusLocalization.SUCCEEDED}
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
      {recordSet !== undefined && hasToolPermission('recordSets', 'read') && (
        <>
          <H2>{queryText.viewRecords()}</H2>
          <Link.NewTab
            className="w-fit"
            href={`/specify/record-set/${recordSet.id}/`}
          >
            <TableIcon label name={tables.Locality.name} />
            {localized(recordSet.name)}
          </Link.NewTab>
        </>
      )}
      {recordSet === undefined && (
        <div className="w-fit">
          <Button.Small onClick={handleFormsOpened}>
            {queryText.browseInForms()}
          </Button.Small>
          {formsOpened && (
            <RecordSelectorFromIds
              canRemove={false}
              defaultIndex={0}
              dialog="modal"
              headerButtons={
                <CreateRecordSet
                  baseTableName="Locality"
                  recordIds={localityIds}
                />
              }
              ids={localityIds}
              isDependent={false}
              isInRecordSet={false}
              newResource={undefined}
              table={tables.Locality}
              title={localityText.localityImportResults()}
              totalCount={localityIds.length}
              onAdd={undefined}
              onClone={undefined}
              onClose={handleFormsClosed}
              onDelete={undefined}
              onSaved={f.void}
              onSlide={undefined}
            />
          )}
        </div>
      )}
    </Dialog>
  );
}

export function LocalityImportFailed({
  taskId,
  traceback,
  onClose: handleClose,
}: {
  readonly taskId: string;
  readonly traceback: string;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <>
          <Button.Info
            onClick={(): void =>
              void downloadFile(
                `Locality Data Set ${taskId} Crash Report - ${new Date().toJSON()}.txt`,
                produceStackTrace(traceback)
              )
            }
          >
            {commonText.downloadErrorMessage()}
          </Button.Info>
          <span className="-ml-4 flex-1" />
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </>
      }
      header={localityText.localityImportFailed()}
      icon="error"
      onClose={handleClose}
    >
      <p>{localityText.localityImportWentWrong()}</p>
    </Dialog>
  );
}

export function LocalityImportParseErrors({
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
                preferencesText.row(),
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
      header={localityText.localityImportFailureResults()}
      icon="error"
      specialMode="noGradient"
      onClose={handleClose}
    >
      <table
        className="grid-table
          grid-cols-[1fr_minmax(12rem,1fr)_1fr]
          overflow-auto
          [&_:is(td,th)]:border-gray-500
          [&_:is(th,td)]:border-b
          [&_:is(th,td)]:p-1
          [&_:is(th,td)]:pr-2
          sm:[&_:is(th,td)]:pr-4
          "
      >
        <thead>
          <tr>
            <td className={`sticky top-0 ${mergeCellBackground()} font-bold`}>
              {preferencesText.row()}
            </td>
            <td className={`sticky top-0 ${mergeCellBackground()} font-bold`}>
              {schemaText.field()}
            </td>
            <td className={`sticky top-0 ${mergeCellBackground()} font-bold`}>
              {mainText.errorMessage()}
            </td>
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
