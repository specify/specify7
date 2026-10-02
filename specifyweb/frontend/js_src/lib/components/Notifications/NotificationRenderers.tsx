import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { backupText } from '../../localization/backup';
import { localityText } from '../../localization/locality';
import { mergingText } from '../../localization/merging';
import { notificationsText } from '../../localization/notifications';
import { setupToolText } from '../../localization/setupTool';
import { treeText } from '../../localization/tree';
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

const notificationHeadings: IR<
  (notification: GenericNotification) => LocalizedString
> = {
  'feed-item-updated': () => notificationsText.feedItemUpdated(),
  'update-feed-failed': () => notificationsText.updateFeedFailed(),
  'dwca-export-complete': () => notificationsText.dwcaExportCompleted(),
  'dwca-export-failed': () => notificationsText.dwcaExportFailed(),
  'query-export-to-csv-complete': () =>
    notificationsText.queryExportToCsvCompleted(),
  'query-export-to-csv-failed': () =>
    notificationsText.queryExportToCsvFailed(),
  'query-export-to-kml-complete': () =>
    notificationsText.queryExportToKmlCompleted(),
  'query-export-to-kml-failed': () =>
    notificationsText.queryExportToKmlFailed(),
  'query-export-to-webportal-complete': () =>
    notificationsText.queryExportToWebPortalCompleted(),
  'query-export-to-webportal-failed': () =>
    notificationsText.queryExportToWebPortalFailed(),
  'dataset-ownership-transferred': (notification) =>
    notificationsText
      .dataSetOwnershipTransferred()
      .replace(
        '<userName />',
        notification.payload['previous-owner-name'] ?? ''
      )
      .replace(
        '<dataSetName />',
        notification.payload['dataset-name'] ?? ''
      ) as LocalizedString,
  'record-merge-starting': () => mergingText.mergingHasStarted(),
  'record-merge-failed': () => mergingText.mergingHasFailed(),
  'record-merge-aborted': () => mergingText.mergingHasBeenCanceled(),
  'record-merge-succeeded': () => mergingText.mergingHasSucceeded(),
  'localityupdate-starting': () => localityText.localityUpdateStarted(),
  'localityupdate-parse-failed': () =>
    localityText.localityUpdateParseFailure(),
  'localityupdate-failed': () => localityText.localityUpdateFailed(),
  'localityupdate-aborted': () => localityText.localityUpdateCancelled(),
  'localityupdate-parse-succeeded': () => localityText.localityUpdateParsed(),
  'localityupdate-succeeded': () => localityText.localityUpdateSucceeded(),
  'backup-succeeded': () => backupText.databaseBackupCompleted(),
  'backup-failed': () => backupText.databaseBackupFailed(),
  'create-default-tree-starting': () => treeText.defaultTreeTaskStarted(),
  'create-default-tree-failed': () => treeText.defaultTreeTaskFailed(),
  'create-default-tree-cancelled': () => treeText.defaultTreeTaskCancelled(),
  'create-default-tree-completed': () => treeText.defaultTreeTaskCompleted(),
  'collection-creation-starting': () =>
    setupToolText.collectionCreationStarted(),
};

export const getNotificationHeading = (
  notification: GenericNotification
): LocalizedString =>
  notificationHeadings[notification.type]?.(notification) ??
  notificationsText.notifications();

export const notificationRenderers: IR<
  (notification: GenericNotification) => React.ReactNode
> = {
  'feed-item-updated'(notification) {
    const filename = notification.payload.file;
    return (
      <>
        {getNotificationHeading(notification)}
        {filename !== null && (
          <Link.Success
            className="w-fit normal-case"
            download
            href={`/static/depository/export_feed/${encodeURIComponent(
              filename
            )}`}
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
        {getNotificationHeading(notification)}
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
        {getNotificationHeading(notification)}
        <Link.Success
          className="w-fit"
          download
          href={`/static/depository/${encodeURIComponent(
            notification.payload.file
          )}`}
        >
          {notificationsText.download()}
        </Link.Success>
      </>
    );
  },
  'dwca-export-failed'(notification) {
    return (
      <>
        {getNotificationHeading(notification)}
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
        {getNotificationHeading(notification)}
        <Link.Success
          className="w-fit"
          download
          href={`/static/depository/${encodeURIComponent(
            notification.payload.file
          )}`}
        >
          {notificationsText.download()}
        </Link.Success>
      </>
    );
  },
  'query-export-to-csv-failed'(notification) {
    const errorPayload = notification.payload.error as unknown as
      | { readonly error: string; readonly traceback: string }
      | undefined;
    return (
      <>
        {getNotificationHeading(notification)}
        {errorPayload !== undefined && (
          <Link.Success
            className="w-fit"
            download
            href={`data:text/plain,${encodeURIComponent(
              `Error: ${errorPayload.error}\n\nTraceback:\n${errorPayload.traceback}`
            )}`}
          >
            {notificationsText.exception()}
          </Link.Success>
        )}
      </>
    );
  },
  'query-export-to-kml-failed'(notification) {
    const errorPayload = notification.payload.error as unknown as
      | { readonly error: string; readonly traceback: string }
      | undefined;
    return (
      <>
        {getNotificationHeading(notification)}
        {errorPayload !== undefined && (
          <Link.Success
            className="w-fit"
            download
            href={`data:text/plain,${encodeURIComponent(
              `Error: ${errorPayload.error}\n\nTraceback:\n${errorPayload.traceback}`
            )}`}
          >
            {notificationsText.exception()}
          </Link.Success>
        )}
      </>
    );
  },
  'query-export-to-kml-complete'(notification) {
    return (
      <>
        {getNotificationHeading(notification)}
        <Link.Success
          className="w-fit"
          download
          href={`/static/depository/${encodeURIComponent(
            notification.payload.file
          )}`}
        >
          {notificationsText.download()}
        </Link.Success>
      </>
    );
  },
  'query-export-to-webportal-complete'(notification) {
    return (
      <>
        {getNotificationHeading(notification)}
        <Link.Success
          className="w-fit"
          download
          href={`/static/depository/${encodeURIComponent(
            notification.payload.file
          )}`}
        >
          {notificationsText.download()}
        </Link.Success>
      </>
    );
  },
  'query-export-to-webportal-failed'(notification) {
    const errorPayload = notification.payload.error as unknown as
      | { readonly error: string; readonly traceback: string }
      | undefined;
    return (
      <>
        {getNotificationHeading(notification)}
        {errorPayload !== undefined && (
          <Link.Success
            className="w-fit"
            download
            href={`data:text/plain,${encodeURIComponent(
              `Error: ${errorPayload.error}\n\nTraceback:\n${errorPayload.traceback}`
            )}`}
          >
            {notificationsText.exception()}
          </Link.Success>
        )}
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
        {getNotificationHeading(notification)}
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
        {getNotificationHeading(notification)}
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
        {getNotificationHeading(notification)}
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
          {getNotificationHeading(notification)}
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
        <p>{getNotificationHeading(notification)}</p>
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
        <p>{getNotificationHeading(notification)}</p>
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
        <p>{getNotificationHeading(notification)}</p>
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
        <p>{getNotificationHeading(notification)}</p>
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
        <p>{getNotificationHeading(notification)}</p>
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
        <p>{getNotificationHeading(notification)}</p>
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
  'backup-succeeded'(notification) {
    const filename = notification.payload.file as unknown as string | undefined;
    return (
      <>
        {getNotificationHeading(notification)}
        {filename && (
          <Link.Success
            className="w-fit"
            download
            href={`/static/depository/${encodeURIComponent(filename)}`}
          >
            {notificationsText.download()}
          </Link.Success>
        )}
      </>
    );
  },
  'backup-failed'(notification) {
    return (
      <>
        <p>{getNotificationHeading(notification)}</p>
        {notification.payload.traceback && (
          <details>
            <summary>Traceback</summary>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs">
              {String(notification.payload.traceback)}
            </pre>
          </details>
        )}
      </>
    );
  },
  'create-default-tree-starting'(notification) {
    return (
      <>
        <p>{getNotificationHeading(notification)}</p>
        {notification.payload.name}
      </>
    );
  },
  'create-default-tree-failed'(notification) {
    return (
      <>
        <p>{getNotificationHeading(notification)}</p>
        {notification.payload.name}
      </>
    );
  },
  'create-default-tree-cancelled'(notification) {
    return (
      <>
        <p>{getNotificationHeading(notification)}</p>
        {notification.payload.name}
      </>
    );
  },
  'create-default-tree-completed'(notification) {
    return (
      <>
        <p>{getNotificationHeading(notification)}</p>
        {notification.payload.name}
      </>
    );
  },
  'collection-creation-starting'(notification) {
    return <p>{getNotificationHeading(notification)}</p>;
  },
  default(notification) {
    console.error('Unknown notification type', { notification });
    return <pre>{JSON.stringify(notification, null, 2)}</pre>;
  },
};
