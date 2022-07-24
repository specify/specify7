import { attachmentsAvailable, attachmentSettingsPromise } from './attachments';
import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import { reportsAvailable } from './components/reports';
import { commonText } from './localization/common';
import {
  fetchContext as fetchPermissions,
  getTablePermissions,
} from './permissions';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
  hasTreeAccess,
} from './permissionutils';
import { getUserPref } from './preferencesutils';
import { schema } from './schema';
import { getDisciplineTrees } from './treedefinitions';
import type { RA } from './types';
import { filterArray } from './types';
import { filterUserTools } from './usertools';

const rawMenuItems: RA<MenuItem> = [
  {
    title: commonText('dataEntry'),
    icon: icons.pencilAt,
    enabled: () =>
      getUserPref('header', 'menu', 'showDataEntry') &&
      // Show DataEntry only if has "create" permission to at least one table
      Object.values(
        getTablePermissions()[schema.domainLevelIds.collection]
      ).some(({ create }) => create),
    url: '/specify/overlay/data-entry/',
  },
  {
    title: commonText('trees'),
    icon: icons.tree,
    enabled: () =>
      getUserPref('header', 'menu', 'showTrees') &&
      getDisciplineTrees().some((treeName) => hasTreeAccess(treeName, 'read')),
    url: '/specify/overlay/trees/',
  },
  {
    title: commonText('interactions'),
    icon: icons.chat,
    url: '/specify/overlay/interactions/',
    enabled: () =>
      getUserPref('header', 'menu', 'showInteractions') &&
      // Show DataEntry only if has "create" permission to at least one table
      Object.values(
        getTablePermissions()[schema.domainLevelIds.collection]
      ).some(({ create }) => create) &&
      hasToolPermission('recordSets', 'read'),
  },
  {
    title: commonText('queries'),
    icon: icons.documentSearch,
    enabled: () =>
      (hasToolPermission('queryBuilder', 'read') ||
        hasPermission('/querybuilder/query', 'execute')) &&
      getUserPref('header', 'menu', 'showQueries'),
    url: '/specify/overlay/queries/',
  },
  {
    title: commonText('recordSets'),
    icon: icons.collection,
    enabled: () =>
      getUserPref('header', 'menu', 'showRecordSets') &&
      hasToolPermission('recordSets', 'read'),
    url: '/specify/overlay/record-sets/',
  },
  {
    title: commonText('reports'),
    icon: icons.documentReport,
    enabled: async () =>
      hasPermission('/report', 'execute') &&
      getUserPref('header', 'menu', 'showReports') &&
      (await reportsAvailable),
    url: '/specify/overlay/reports/',
  },
  {
    url: '/specify/overlay/data-sets/',
    title: commonText('workBench'),
    icon: icons.table,
    enabled: () => getUserPref('header', 'menu', 'showWorkBench'),
  },
  {
    title: commonText('attachments'),
    icon: icons.link,
    async enabled(): Promise<boolean> {
      if (
        !hasTablePermission('Attachment', 'read') ||
        !getUserPref('header', 'menu', 'showAttachments')
      )
        return false;
      await attachmentSettingsPromise;
      return attachmentsAvailable();
    },
    url: '/specify/attachments/',
  },
];

export const menuItemsPromise = fetchPermissions
  .then(() => filterUserTools(rawMenuItems))
  .then(filterArray);
