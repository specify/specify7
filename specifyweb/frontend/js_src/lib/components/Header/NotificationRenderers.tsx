import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { notificationsText } from '../../localization/notifications';
import { StringToJsx } from '../../localization/utils';
import type { IR } from '../../utils/types';
import { Link } from '../Atoms/Link';

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
          className="w-fit"
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
  default(notification) {
    console.error('Unknown notification type', { notification });
    return <pre>{JSON.stringify(notification, null, 2)}</pre>;
  },
};
