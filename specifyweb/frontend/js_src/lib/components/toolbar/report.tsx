import { ajax } from '../../ajax';
import { icons } from '../icons';
import type { MenuItem } from '../main';
import { cachableUrl } from '../../initialcontext';
import { commonText } from '../../localization/common';
import { hasPermission } from '../../permissions';
import { ReportsView } from '../../reports';
import { getUserPref } from '../../preferencesutils';
import { RenderView } from '../reactbackboneextend';
import React from 'react';

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
      getUserPref('header', 'menu', 'showQueries'),
    isOverlay: true,
    view: ({ onClose: handleClose }) => (
      <RenderView
        getView={(element) => {
          const view = new ReportsView({
            el: element,
            onClose: handleClose,
          }).render();
          return (): void => view.remove();
        }}
      />
    ),
  }));
