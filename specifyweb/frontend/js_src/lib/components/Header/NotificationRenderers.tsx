import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { notificationsText } from '../../localization/notifications';
import { StringToJsx } from '../../localization/utils';
import type { IR } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { mergingText } from '../../localization/merging';
import { TableIcon } from '../Molecules/TableIcon';
import { mergingQueryParameter } from '../Merging';
import { userInformation } from '../InitialContext/userInformation';
import { formatUrl } from '../Router/queryString';
import { commonText } from '../../localization/common';
import { FormattedResource } from '../Molecules/FormattedResource';
import { getModel } from '../DataModel/schema';

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
        <Link.Green
          className="w-fit normal-case"
          download
          href={`/static/depository/export_feed/${filename}`}
        >
          {filename}
        </Link.Green>
      </>
    );
  },
  'update-feed-failed'(notification) {
    return (
      <>
        {notificationsText.updateFeedFailed()}
        <Link.Green
          className="w-fit"
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {notificationsText.exception()}
        </Link.Green>
      </>
    );
  },
  'dwca-export-complete'(notification) {
    return (
      <>
        {notificationsText.dwcaExportCompleted()}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {notificationsText.download()}
        </Link.Green>
      </>
    );
  },
  'dwca-export-failed'(notification) {
    return (
      <>
        {notificationsText.dwcaExportFailed()}
        <Link.Green
          className="w-fit"
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {notificationsText.exception()}
        </Link.Green>
      </>
    );
  },
  'query-export-to-csv-complete'(notification) {
    return (
      <>
        {notificationsText.queryExportToCsvCompleted()}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {notificationsText.download()}
        </Link.Green>
      </>
    );
  },
  'query-export-to-kml-complete'(notification) {
    return (
      <>
        {notificationsText.queryExportToKmlCompleted()}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {notificationsText.download()}
        </Link.Green>
      </>
    );
  },
  'dataset-ownership-transferred'(notification) {
    return (
      <StringToJsx
        components={{
          userName: <i>{notification.payload['previous-owner-name']}</i>,
          dataSetName: (
            <Link.Default
              href={`/specify/workbench/${notification.payload['dataset-id']}/`}
            >
              <i>{notification.payload['dataset-name']}</i>
            </Link.Default>
          ),
        }}
        string={notificationsText.dataSetOwnershipTransferred()}
      />
    );
  },
  'record-merge-starting'(notification) {
    const tableName = notification.payload.table;
    const collectionId = parseInt(notification.payload.collection_id);
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
    const id = parseInt(notification.payload.new_record_id);
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
  'record-merge-succeeded'(notification) {
    const id = Number.parseInt(notification.payload.new_record_id);
    const tableName = notification.payload.table;
    const model = getModel(tableName);
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
            <FormattedResource asLink={true} resource={resource} />
          </div>
        </>
      )
    );
  },
  default(notification) {
    console.error('Unknown notification type', { notification });
    return <pre>{JSON.stringify(notification, null, 2)}</pre>;
  },
};
