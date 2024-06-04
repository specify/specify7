import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { mainText } from '../../localization/main';
import { notificationsText } from '../../localization/notifications';
import { queryText } from '../../localization/query';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { H2, Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { SECOND } from '../Atoms/timeUnits';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import type { RecordSet } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { useTitle } from '../Molecules/AppTitle';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasToolPermission } from '../Permissions/helpers';
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
  onClose: handleClose,
}: {
  readonly taskId: string;
  readonly onClose: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<LocalityImportState>({
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
      void ajax<LocalityImportState>(`/api/localityset/status/${taskId}`, {
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
            (
              ['PROGRESS', 'PARSING', 'PENDING'] as RA<LocalityImportTaskStatus>
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

  const loading = React.useContext(LoadingContext);

  const title = localityImportStatusLocalization[state.taskstatus];
  useTitle(title);

  return (['PARSING', 'PROGRESS'] as RA<LocalityImportTaskStatus>).includes(
    state.taskstatus
  ) ? (
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
