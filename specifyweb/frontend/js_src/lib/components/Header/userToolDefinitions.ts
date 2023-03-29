import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { preferencesText } from '../../localization/preferences';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { userText } from '../../localization/user';
import { welcomeText } from '../../localization/welcome';
import type { IR } from '../../utils/types';
import { ensure } from '../../utils/types';
import { toLowerCase } from '../../utils/utils';
import { icons } from '../Atoms/Icons';
import type { MenuItem } from '../Core/Main';
import { getDisciplineTrees } from '../InitialContext/treeRanks';
import { userInformation } from '../InitialContext/userInformation';
import { fetchContext as userPermission } from '../Permissions';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
} from '../Permissions/helpers';
import { filterMenuItems } from './menuItemProcessing';

const rawUserTools = ensure<IR<IR<Omit<MenuItem, 'name'>>>>()({
  [userText.userAccount()]: {
    logOut: {
      title: userText.logOut(),
      url: '/accounts/logout/',
      icon: icons.logout,
      enabled: () => userInformation.isauthenticated,
    },
    changePassword: {
      title: userText.changePassword(),
      url: '/accounts/password_change/',
      icon: icons.key,
      enabled: () => userInformation.isauthenticated,
    },
    logIn: {
      title: userText.logIn(),
      url: '/accounts/login/',
      icon: icons.login,
      enabled: () => !userInformation.isauthenticated,
    },
  },
  [preferencesText.customization()]: {
    userPreferences: {
      title: preferencesText.preferences(),
      url: '/specify/user-preferences/',
      icon: icons.cog,
    },
    schemaConfig: {
      title: schemaText.schemaConfig(),
      url: '/specify/schema-config/',
      icon: icons.adjustments,
    },
  },
  [headerText.administration()]: {
    resources: {
      title: resourcesText.appResources(),
      url: '/specify/resources/',
      icon: icons.document,
      enabled: () =>
        hasToolPermission('resources', 'read') &&
        hasTablePermission('Discipline', 'read') &&
        hasTablePermission('Collection', 'read') &&
        hasTablePermission('SpecifyUser', 'read'),
    },
    securityPanel: {
      title: userText.securityPanel(),
      url: '/specify/security/',
      icon: icons.fingerPrint,
    },
    repairTree: {
      title: headerText.repairTree(),
      url: '/specify/overlay/tree-repair/',
      icon: icons.checkCircle,
      enabled: () =>
        getDisciplineTrees().some((treeName) =>
          hasPermission(`/tree/edit/${toLowerCase(treeName)}`, 'repair')
        ),
    },
    generateMasterKey: {
      title: userText.generateMasterKey(),
      url: '/specify/overlay/master-key/',
      icon: icons.identification,
    },
  },
  [commonText.export()]: {
    makeDwca: {
      title: headerText.makeDwca(),
      enabled: () => hasPermission('/export/dwca', 'execute'),
      url: '/specify/overlay/make-dwca/',
      icon: icons.upload,
    },
    updateExportFeed: {
      title: headerText.updateExportFeed(),
      enabled: () => hasPermission('/export/feed', 'force_update'),
      url: '/specify/overlay/force-update-feed/',
      icon: icons.cloud,
    },
  },
  [headerText.documentation()]: {
    aboutSpecify: {
      title: welcomeText.aboutSpecify(),
      url: '/specify/overlay/about/',
      icon: icons.informationCircle,
    },
    forum: {
      title: headerText.forum(),
      url: 'https://discourse.specifysoftware.org/',
      icon: icons.annotation,
    },
    technicalDocumentation: {
      title: headerText.technicalDocumentation(),
      url: 'https://github.com/specify/specify7/wiki',
      icon: icons.bookOpen,
    },
  },
  [headerText.developers()]: {
    databaseSchema: {
      title: schemaText.databaseSchema(),
      url: '/specify/datamodel/',
      icon: icons.database,
    },
    clearCache: {
      title: headerText.clearCache(),
      url: '/specify/command/clear-cache/',
      icon: icons.backspace,
    },
    tableApi: {
      title: headerText.tableApi(),
      url: '/documentation/api/tables/',
      icon: icons.cube,
    },
    operationsApi: {
      title: headerText.operationsApi(),
      url: '/documentation/api/operations/',
      icon: icons.cubeTransparent,
    },
  },
} as const);

/**
 * Do not us directly. Use useUserTools() instead
 */
export const rawUserToolsPromise = Promise.all([
  userPermission,
  import('../InitialContext/userInformation').then(
    async ({ fetchContext }) => fetchContext
  ),
])
  .then(async () =>
    Promise.all(
      Object.entries(rawUserTools).map(
        async ([groupLabel, userTools]) =>
          [
            groupLabel,
            await filterMenuItems(userTools).then((items) =>
              Object.fromEntries(
                items.map((item) => [item.name, item] as const)
              )
            ),
          ] as const
      )
    )
  )
  .then((groups) => Object.fromEntries(groups));
