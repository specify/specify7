import React from 'react';

import {commonText} from '../../localization/common';
import type {IR} from '../../utils/types';
import {Link} from '../Atoms/Link';

export type GenericNotification = {
  readonly messageId: string;
  readonly read: boolean;
  readonly timestamp: string;
  readonly type: string;
  readonly payload: IR<string>;
};

export const notificationRenderers: IR<(notification: GenericNotification) => React.ReactNode> = {
  'feed-item-updated'(notification) {
    const filename = notification.payload.file;
    return (
      <>
        {commonText('feedItemUpdated')}
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
        {commonText('updateFeedFailed')}
        <Link.Green
          className="w-fit"
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </Link.Green>
      </>
    );
  },
  'dwca-export-complete'(notification) {
    return (
      <>
        {commonText('dwcaExportCompleted')}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {commonText('download')}
        </Link.Green>
      </>
    );
  },
  'dwca-export-failed'(notification) {
    return (
      <>
        {commonText('dwcaExportFailed')}
        <Link.Green
          className="w-fit"
          download
          href={`data:application/json:${JSON.stringify(notification.payload)}`}
        >
          {commonText('exception')}
        </Link.Green>
      </>
    );
  },
  'query-export-to-csv-complete'(notification) {
    return (
      <>
        {commonText('queryExportToCsvCompleted')}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {commonText('download')}
        </Link.Green>
      </>
    );
  },
  'query-export-to-kml-complete'(notification) {
    return (
      <>
        {commonText('queryExportToKmlCompleted')}
        <Link.Green
          className="w-fit"
          download
          href={`/static/depository/${notification.payload.file}`}
        >
          {commonText('download')}
        </Link.Green>
      </>
    );
  },
  'dataset-ownership-transferred'(notification) {
    return commonText(
      'dataSetOwnershipTransferred',
      <i>{notification.payload['previous-owner-name']}</i>,
      <Link.Default
        href={`/specify/workbench/${notification.payload['dataset-id']}/`}
      >
        <i>{notification.payload['dataset-name']}</i>
      </Link.Default>
    );
  },
  default(notification) {
    console.error('Unknown notification type', {notification});
    return <pre>{JSON.stringify(notification, null, 2)}</pre>;
  },
};