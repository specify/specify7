import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { localityText } from '../../localization/locality';
import { mergingText } from '../../localization/merging';
import { notificationsText } from '../../localization/notifications';
import { StringToJsx } from '../../localization/utils';
import type { IR, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { getTable } from '../DataModel/tables';
import { userInformation } from '../InitialContext/userInformation';
import {
  LocalityUpdateFailed,
  LocalityUpdateParseErrors,
  LocalityUpdateSuccess,
} from '../LocalityUpdate/Status';
import type { LocalityUpdateParseError } from '../LocalityUpdate/types';
import { mergingQueryParameter } from '../Merging/queryString';
import { FormattedResource } from '../Molecules/FormattedResource';
import { TableIcon } from '../Molecules/TableIcon';
import { formatUrl } from '../Router/queryString';

export type GenericNotification = {
  readonly messageId: string;
  readonly read: boolean;
  readonly timestamp: string;
  readonly type: string;
  readonly payload: IR<LocalizedString>;
};

export const notificationRenderers: IR<
  (notification: GenericNotification) => React.ReactNode
> = {
  'feed-item-updated'(notification) {
    const filename = notification.payload.file;
    return (
      <>
        {notificationsText.feedItemUpdated()}
        {filename !== null && (
          <Link.Success
            className="w-fit normal-case"
            download
            href={`/static/depository/export_feed/${filename}`}
          >
            {filename}
          </Link.Success>
        )}
      </>
    );
  },
  'update-feed-failed'(notification) {
    return (
      <>
        {notificationsText.updateFeedFailed()}
        <Link.Success
          className="w-fit"
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {notificationsText.exception()}
        </Link.Success>
      </>
    );
  },
  'dwca-export-complete'(notification) {
    return (
      <>
        {notificationsText.dwcaExportCompleted()}
        <Link.Success
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {notificationsText.download()}
        </Link.Success>
      </>
    );
  },
  'dwca-export-failed'(notification) {
    return (
      <>
        {notificationsText.dwcaExportFailed()}
        <Link.Success
          className="w-fit"
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {notificationsText.exception()}
        </Link.Success>
      </>
    );
  },
  'query-export-to-csv-complete'(notification) {
    return (
      <>
        {notificationsText.queryExportToCsvCompleted()}
        <Link.Success
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {notificationsText.download()}
        </Link.Success>
      </>
    );
  },
  'query-export-to-kml-complete'(notification) {
    return (
      <>
        {notificationsText.queryExportToKmlCompleted()}
        <Link.Success
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {notificationsText.download()}
        </Link.Success>
      </>
    );
  },
  'dataset-ownership-transferred'(notification) {
    return (
      <StringToJsx
        components={{
          userName: <i>{notification.payload['previous-owner-name']}</i>,
          dataSetName: (
            <Link.NewTab
              href={`/specify/workbench/${notification.payload['dataset-id']}/`}
            >
              <i>{notification.payload['dataset-name']}</i>
            </Link.NewTab>
          ),
        }}
        string={notificationsText.dataSetOwnershipTransferred()}
      />
    );
  },
  'record-merge-starting'(notification) {
    const tableName = notification.payload.table;
    const collectionId = Number.parseInt(notification.payload.collection_id);
    const mergeName = notification.payload.name;
    const collection = userInformation.availableCollections.find(
      ({ id }) => id === collectionId
    );

    return (
      <>
        {mergingText.mergingHasStarted()}
        <div className="flex items-center gap-2">
          <TableIcon label name={tableName} />
          <p>{`${collection?.collectionName} - ${mergeName}`}</p>
        </div>
      </>
    );
  },
  'record-merge-failed'(notification) {
    const tableName = notification.payload.table;
    const id = Number.parseInt(notification.payload.new_record_id);
    const ids = [JSON.parse(notification.payload.old_record_ids), id];
    const url = formatUrl(`/specify/overlay/merge/${tableName}/`, {
      [mergingQueryParameter]: Array.from(ids).join(','),
    });
    return (
      <>
        {mergingText.mergingHasFailed()}
        <div className="flex items-center gap-2">
          <TableIcon label name={tableName} />
          <Link.NewTab href={url}>{mergingText.retryMerge()}</Link.NewTab>
        </div>
      </>
    );
  },
  'record-merge-aborted'(notification) {
    const tableName = notification.payload.table;
    const collectionId = Number.parseInt(notification.payload.collection_id);
    const mergeName = notification.payload.name;
    const collection = userInformation.availableCollections.find(
      ({ id }) => id === collectionId
    );

    return (
      <>
        {mergingText.mergingHasBeenCanceled()}
        <div className="flex items-center gap-2">
          <TableIcon label name={tableName} />
          <p>{`${collection?.collectionName} - ${mergeName}`}</p>
        </div>
      </>
    );
  },
  'record-merge-succeeded'(notification) {
    const id = Number.parseInt(notification.payload.new_record_id);
    const tableName = notification.payload.table;
    const model = getTable(tableName);
    const resource = React.useMemo(
      () =>
        typeof model === 'object' ? new model.Resource({ id }) : undefined,
      [model, id]
    );
    return (
      resource !== undefined && (
        <>
          {mergingText.mergingHasSucceeded()}
          <div className="flex items-center gap-2">
            <TableIcon label name={tableName} />
            <FormattedResource asLink resource={resource} />
          </div>
        </>
      )
    );
  },
  'localityupdate-starting'(notification) {
    return (
      <>
        <p>{localityText.localityUpdateStarted()}</p>
        <details>
          <summary>{localityText.taskId()}</summary>
          {notification.payload.taskid}
        </details>
      </>
    );
  },
  'localityupdate-parse-failed'(notification) {
    const [isOpen, handleOpen, handleClose] = useBooleanState();
    return (
      <>
        <p>{localityText.localityUpdateParseFailure()}</p>
        <Button.Small onClick={handleOpen}>
          {localityText.localityUpdateFailureResults()}
        </Button.Small>
        {isOpen && (
          <LocalityUpdateParseErrors
            errors={
              notification.payload
                .errors as unknown as RA<LocalityUpdateParseError>
            }
            onClose={handleClose}
          />
        )}
        <details>
          <summary>{localityText.taskId()}</summary>
          {notification.payload.taskid}
        </details>
      </>
    );
  },
  'localityupdate-failed'(notification) {
    const [isOpen, handleOpen, handleClose] = useBooleanState();
    return (
      <>
        <p>{localityText.localityUpdateFailed()}</p>
        <Button.Small onClick={handleOpen}>
          {localityText.localityUpdateFailureResults()}
        </Button.Small>
        {isOpen && (
          <LocalityUpdateFailed
            taskId={notification.payload.taskid}
            traceback={notification.payload.traceback}
            onClose={handleClose}
          />
        )}
        <details>
          <summary>{localityText.taskId()}</summary>
          {notification.payload.taskid}
        </details>
      </>
    );
  },
  'localityupdate-aborted'(notification) {
    return (
      <>
        <p>{localityText.localityUpdateCancelled()}</p>
        <details>
          <summary>{localityText.taskId()}</summary>
          {notification.payload.taskid}
        </details>
      </>
    );
  },
  'localityupdate-parse-succeeded'(notification) {
    return (
      <>
        <p>{localityText.localityUpdateParsed()}</p>
        <details>
          <summary>{localityText.taskId()}</summary>
          {notification.payload.taskid}
        </details>
      </>
    );
  },
  'localityupdate-succeeded'(notification) {
    const [isOpen, handleOpen, handleClose] = useBooleanState();
    return (
      <>
        <p>{localityText.localityUpdateSucceeded()}</p>
        <Button.Small onClick={handleOpen}>
          {localityText.localityUpdateResults()}
        </Button.Small>
        {isOpen && (
          <LocalityUpdateSuccess
            geoCoordDetailIds={
              notification.payload.geocoorddetails as unknown as RA<number>
            }
            localityIds={
              notification.payload.localities as unknown as RA<number>
            }
            recordSetId={
              notification.payload.recordsetid as unknown as number | undefined
            }
            onClose={handleClose}
          />
        )}
        <details>
          <summary>{localityText.taskId()}</summary>
          {notification.payload.taskid}
        </details>
      </>
    );
  },
  default(notification) {
    console.error('Unknown notification type', { notification });
    return <pre>{JSON.stringify(notification, null, 2)}</pre>;
  },
};
