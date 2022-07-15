import React from 'react';

import { commonText } from '../../localization/common';
import { getTablePermissions } from '../../permissions';
import { hasToolPermission } from '../../permissionutils';
import { getUserPref } from '../../preferencesutils';
import { schema } from '../../schema';
import { icons } from '../icons';
import { InteractionsDialog } from '../interactionsdialog';
import type { MenuItem } from '../main';

export const menuItem: MenuItem = {
  task: 'interactions',
  title: commonText('interactions'),
  icon: icons.chat,
  isOverlay: true,
  enabled: () =>
    getUserPref('header', 'menu', 'showInteractions') &&
    // Show DataEntry only if has "create" permission to at least one table
    Object.values(getTablePermissions()[schema.domainLevelIds.collection]).some(
      ({ create }) => create
    ) &&
    hasToolPermission('recordSets', 'read'),
  view: ({ onClose: handleClose, urlParameter }) => (
    <InteractionsDialog onClose={handleClose} urlParameter={urlParameter} />
  ),
};
