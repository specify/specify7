import ajax from './ajax';
import type { MenuItem } from './components/main';
import commonText from './localization/common';
import reports from './reports';

export default ajax<{ readonly available: boolean }>(
  '/context/report_runner_status.json',
  {
    headers: { Accept: 'application/json' },
  }
).then<MenuItem>(({ data: { available } }) => ({
  task: 'report',
  title: commonText('reports'),
  icon: '/static/img/report_icon.png',
  enabled: available,
  execute: reports,
}));
