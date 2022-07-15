import React from 'react';

import { fetchCollection } from '../../collection';
import { commonText } from '../../localization/common';
import { hasToolPermission } from '../../permissionutils';
import { getUserPref } from '../../preferencesutils';
import { userInformation } from '../../userinfo';
import { icons } from '../icons';
import type { MenuItem } from '../main';
import { RecordSetsDialog } from '../recordsetsdialog';
import { ErrorBoundary } from '../errorboundary';

export const menuItem: MenuItem = {
  task: 'recordsets',
  title: commonText('recordSets'),
  icon: icons.collection,
  isOverlay: true,
  enabled: () =>
    getUserPref('header', 'menu', 'showRecordSets') &&
    hasToolPermission('recordSets', 'read'),
  view: ({ onClose: handleClose }) => (
    <ErrorBoundary dismissable>
      <RecordSetDialog onClose={handleClose} />
    </ErrorBoundary>
  ),
};

// Create a separate component to fix https://github.com/specify/specify7/issues/1453
function RecordSetDialog({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  const recordSetsPromise = React.useMemo(
    async () =>
      fetchCollection('RecordSet', {
        specifyUser: userInformation.id,
        type: 0,
        limit: 5000,
        domainFilter: true,
        orderBy: '-timestampCreated',
      }),
    []
  );
  return (
    <RecordSetsDialog
      recordSetsPromise={recordSetsPromise}
      isReadOnly={false}
      onClose={handleClose}
    />
  );
}
