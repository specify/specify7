import { ajax } from './ajax';
import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import commonText from './localization/common';
import { ReportsView } from './reports';

export default ajax<{ readonly available: boolean }>(
  '/context/report_runner_status.json',
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
    enabled: available,
    isOverlay: true,
    view: ({ onClose }) => new ReportsView({ onClose }),
  }));
