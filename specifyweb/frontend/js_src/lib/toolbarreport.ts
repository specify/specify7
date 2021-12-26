import ajax from './ajax';
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
  .then<MenuItem>(async ({ data: { available } }) => ({
    task: 'report',
    title: commonText('reports'),
    icon: '/static/img/report_icon.png',
    enabled: available,
    view: ({ onClose }) => new ReportsView({ onClose }),
  }));
