import { ajax } from './ajax';
import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import { cachableUrl } from './initialcontext';
import { commonText } from './localization/common';
import { hasPermission } from './permissions';
import { ReportsView } from './reports';

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
    enabled: available && hasPermission('/report', 'execute'),
    isOverlay: true,
    view: ({ onClose }) => new ReportsView({ onClose }),
  }));
