/**
 * App Resources Dialog
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { Link } from '../basic';
import { useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';
import { hasToolPermission } from '../../permissions';

function AppResourceDialog({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('resources'));

  return (
    <Dialog
      title={commonText('resourcesDialogTitle')}
      header={commonText('resourcesDialogHeader')}
      onClose={handleClose}
      buttons={commonText('cancel')}
    >
      <nav className="contents">
        <Link.Default href="/specify/appresources/">
          {commonText('appResources')}
        </Link.Default>
        <Link.Default href="/specify/viewsets/">
          {commonText('viewSets')}
        </Link.Default>
      </nav>
    </Dialog>
  );
}

export const userTool: UserTool = {
  task: 'resources',
  title: commonText('resources'),
  isOverlay: true,
  view: ({ onClose: handleClose }) => (
    <AppResourceDialog onClose={handleClose} />
  ),
  enabled: () => hasToolPermission('resources', 'read'),
  groupLabel: commonText('administration'),
};
