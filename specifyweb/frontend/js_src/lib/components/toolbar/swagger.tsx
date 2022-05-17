import { commonText } from '../../localization/common';
import type { RA } from '../../types';
import type { UserTool } from '../main';

/**
 * Define links to the Swagger UI pages
 */
export const userTools: RA<UserTool> = [
  {
    task: 'swagger-tables',
    title: commonText('tableApi'),
    isOverlay: false,
    basePath: '',
    view: '/documentation/api/tables/',
    groupLabel: commonText('developers'),
  },
  {
    task: 'swagger-operations',
    title: commonText('operationsApi'),
    isOverlay: false,
    basePath: '',
    view: '/documentation/api/operations/',
    groupLabel: commonText('developers'),
  },
] as const;
