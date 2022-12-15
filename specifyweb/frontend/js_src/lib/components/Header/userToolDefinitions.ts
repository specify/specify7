import type { UserTool } from '../Core/Main';
import { sortFunction, split, toLowerCase } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { welcomeText } from '../../localization/welcome';
import { fetchContext as userPermission } from '../Permissions';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
} from '../Permissions/helpers';
import { getDisciplineTrees } from '../InitialContext/treeRanks';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { fetchContext as fetchUserInfo } from '../InitialContext/userInformation';
import { schemaText } from '../../localization/schema';
import { headerText } from '../../localization/header';
import { userText } from '../../localization/user';
import { preferencesText } from '../../localization/preferences';

const rawUserTools: IR<RA<UserTool>> = {
  [userText('userAccount')]: [
    {
      title: userText('logOut'),
      url: '/accounts/logout/',
    },
    {
      title: userText('changePassword'),
      url: '/accounts/password_change/',
    },
  ],
  [preferencesText('customization')]: [
    {
      title: preferencesText('preferences'),
      url: '/specify/user-preferences/',
    },
    {
      title: schemaText('schemaConfig'),
      url: '/specify/schema-config/',
    },
  ],
  [commonText('administration')]: [
    {
      title: commonText('appResources'),
      url: '/specify/resources/',
      enabled: () =>
        hasToolPermission('resources', 'read') &&
        hasTablePermission('Discipline', 'read') &&
        hasTablePermission('Collection', 'read') &&
        hasTablePermission('SpecifyUser', 'read'),
    },
    {
      title: userText('securityPanel'),
      url: '/specify/security/',
    },
    {
      title: headerText('repairTree'),
      url: '/specify/overlay/tree-repair/',
      enabled: () =>
        getDisciplineTrees().some((treeName) =>
          hasPermission(`/tree/edit/${toLowerCase(treeName)}`, 'repair')
        ),
    },
    {
      title: userText('generateMasterKey'),
      url: '/specify/overlay/master-key/',
    },
  ],
  [commonText('export')]: [
    {
      title: headerText('makeDwca'),
      enabled: () => hasPermission('/export/dwca', 'execute'),
      url: '/specify/overlay/make-dwca/',
    },
    {
      title: headerText('updateExportFeed'),
      enabled: () => hasPermission('/export/feed', 'force_update'),
      url: '/specify/overlay/force-update-feed/',
    },
  ],
  [headerText('documentation')]: [
    {
      title: welcomeText('aboutSpecify'),
      url: '/specify/overlay/about/',
    },
    {
      title: headerText('forum'),
      url: 'https://discourse.specifysoftware.org/',
    },
    {
      title: headerText('technicalDocumentation'),
      url: 'https://github.com/specify/specify7/wiki',
    },
  ],
  [headerText('developers')]: [
    {
      title: schemaText('databaseSchema'),
      url: '/specify/datamodel/',
    },
    {
      title: headerText('clearCache'),
      url: '/specify/command/clear-cache/',
    },
    {
      title: headerText('tableApi'),
      url: '/documentation/api/tables/',
    },
    {
      title: headerText('operationsApi'),
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
