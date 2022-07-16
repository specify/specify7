import React from 'react';

import { ajax } from '../../ajax';
import { cachableUrl } from '../../initialcontext';
import { commonText } from '../../localization/common';
import { hasPermission } from '../../permissionutils';
import { getUserPref } from '../../preferencesutils';
import { icons } from '../icons';
import type { MenuItem } from '../main';
import { ReportsView } from '../reports';

export const menuItem = ajax<{ readonly available: boolean }>(
  cachableUrl('/context/report_runner_status.json'),
  {
    headers: { Accept: 'application/json' },
  },
  { strict: false }
)
  .catch(() => ({ data: { available: false } }))
  .then<MenuItem>(({ data: { available } }) => ({
    task: 'report',
    title: commonText('reports'),
    icon: icons.documentReport,
    enabled:
      available &&
      hasPermission('/report', 'execute') &&
      getUserPref('header', 'menu', 'showReports'),
    isOverlay: true,
    view: ({ onClose: handleClose }) => (
      <ReportsView
        onClose={handleClose}
        autoSelectSingle={false}
        model={undefined}
        resourceId={undefined}
      />
    ),
  }));
