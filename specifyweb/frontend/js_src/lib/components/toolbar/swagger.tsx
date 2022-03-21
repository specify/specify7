import commonText from '../../localization/common';
import type { RA } from '../../types';
import type { UserTool } from '../main';

export const toolbarItems: RA<UserTool> = [
  {
    task: 'swagger-tables',
    title: commonText('tableApi'),
    isOverlay: false,
    view: '/documentation/api/tables/',
  },
  {
    task: 'swagger-operations',
    title: commonText('operationsApi'),
    isOverlay: false,
    view: '/documentation/api/operations/',
  },
];
