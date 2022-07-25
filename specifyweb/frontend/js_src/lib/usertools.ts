import type { UserTool } from './components/main';
import { sortFunction, split, toLowerCase } from './helpers';
import { adminText } from './localization/admin';
import { commonText } from './localization/common';
import { welcomeText } from './localization/welcome';
import { fetchContext as userPermission } from './permissions';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
} from './permissionutils';
import { getDisciplineTrees } from './treedefinitions';
import type { IR, RA } from './types';
import { filterArray } from './types';
import { fetchContext as fetchUserInfo } from './userinfo';

const rawUserTools: IR<RA<UserTool>> = {
  [commonText('userAccount')]: [
    {
      title: commonText('logOut'),
      url: '/accounts/logout/',
    },
    {
      title: commonText('changePassword'),
      url: '/accounts/password_change/',
    },
  ],
  [commonText('customization')]: [
    {
      title: commonText('preferences'),
      url: '/specify/user-preferences/',
    },
    {
      title: commonText('schemaConfig'),
      url: '/specify/schema-config/',
    },
  ],
  [commonText('administration')]: [
    {
      title: commonText('appResources'),
      url: '/specify/appresources/',
      enabled: () =>
        hasToolPermission('resources', 'read') &&
        hasTablePermission('Discipline', 'read') &&
        hasTablePermission('Collection', 'read') &&
        hasTablePermission('SpecifyUser', 'read'),
    },
    {
      title: adminText('securityPanel'),
      url: '/specify/security/',
    },
    {
      title: commonText('repairTree'),
      url: '/specify/overlay/tree-repair/',
      enabled: () =>
        getDisciplineTrees().some((treeName) =>
          hasPermission(`/tree/edit/${toLowerCase(treeName)}`, 'repair')
        ),
    },
    {
      title: commonText('generateMasterKey'),
      url: '/specify/overlay/master-key/',
    },
  ],
  [commonText('export')]: [
    {
      title: commonText('makeDwca'),
      enabled: () => hasPermission('/export/dwca', 'execute'),
      url: '/specify/overlay/make-dwca/',
    },
    {
      title: commonText('updateExportFeed'),
      enabled: () => hasPermission('/export/feed', 'force_update'),
      url: '/specify/overlay/force-update-feed/',
    },
  ],
  [commonText('documentation')]: [
    {
      title: welcomeText('aboutSpecify'),
      url: '/specify/overlay/about/',
    },
    {
      title: commonText('forum'),
      url: 'https://discourse.specifysoftware.org/',
    },
    {
      title: commonText('technicalDocumentation'),
      url: 'https://github.com/specify/specify7/wiki',
    },
  ],
  [commonText('developers')]: [
    {
      title: commonText('databaseSchema'),
      url: '/specify/datamodel/',
    },
    {
      title: commonText('clearCache'),
      url: '/specify/command/clear-cache/',
    },
    {
      title: commonText('tableApi'),
      url: '/documentation/api/tables/',
    },
    {
      title: commonText('operationsApi'),
      url: '/documentation/api/operations/',
    },
  ],
};

export const userToolsPromise: Promise<RA<IR<RA<UserTool>>>> = Promise.all([
  userPermission,
  fetchUserInfo,
])
  .then(async () =>
    Promise.all(
      Object.entries(rawUserTools).map(
        async ([groupLabel, userTools]) =>
          [groupLabel, await filterUserTools(userTools)] as const
      )
    )
  )
  .then((groups) =>
    groups
      .filter(([_name, userTools]) => userTools.length > 0)
      .map(([name, userTools]) => [
        name,
        Array.from(userTools).sort(sortFunction(({ title }) => title)),
      ])
  )
  .then((groups) => Object.fromEntries(groups))
  .then((userTools) =>
    /*
     * Can't split columns with CSS because break-inside:avoid is not yet
     * well-supported
     */
    split(
      Object.entries(userTools),
      (_item, index, { length }) => index >= length / 2
    ).map((group) => Object.fromEntries(group))
  );

export const filterUserTools = async <T extends UserTool>(
  userTools: RA<T>
): Promise<RA<T>> =>
  Promise.all(
    userTools.map(async (entry) =>
      (await entry.enabled?.()) === false ? undefined : entry
    )
  ).then(filterArray);
