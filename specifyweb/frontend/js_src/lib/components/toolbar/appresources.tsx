import { commonText } from '../../localization/common';
import { hasTablePermission, hasToolPermission } from '../../permissions';
import type { UserTool } from '../main';

export const userTool: UserTool = {
  task: 'app-resources',
  title: commonText('appResources'),
  isOverlay: false,
  view: '/specify/appresources/',
  enabled: () =>
    hasToolPermission('resources', 'read') &&
    hasTablePermission('Discipline', 'read') &&
    hasTablePermission('Collection', 'read') &&
    hasTablePermission('SpecifyUser', 'read'),
  groupLabel: commonText('administration'),
};
