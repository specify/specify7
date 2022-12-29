import {IR, RR} from '../../utils/types';
import {AppResourceMode} from './helpers';
import {icons} from '../Atoms/Icons';
import {adminText} from '../../localization/admin';
import {Tables} from '../DataModel/types';
import {commonText} from '../../localization/common';

export type AppResourceType = {
  readonly tableName: keyof Tables & ('SpAppResource' | 'SpViewSetObj');
  readonly icon: JSX.Element;
  readonly label: string;
};

export const appResourceTypes: RR<AppResourceMode, AppResourceType> = {
  appResources: {
    tableName: 'SpAppResource',
    icon: icons.cog,
    label: adminText('appResource'),
  },
  viewSets: {
    tableName: 'SpViewSetObj',
    icon: icons.pencilAt,
    label: commonText('formDefinitions'),
  },
};

export type AppResourceSubType = {
  readonly mimeType: string | undefined;
  readonly name: string | undefined;
  readonly documentationUrl: string | undefined;
  readonly icon: JSX.Element;
  readonly label: string;
};

/**
 * The order of the subtypes matters. The filtering algorithm loops over these
 * in the order they are defined to find the first subType that matches the
 * current resource. Thus, subtypes should be sorted from the most
 * specific to the least specific.
 */
export const appResourceSubTypes = {
  label: {
    mimeType: 'jrxml/label',
    name: undefined,
    documentationUrl:
      'https://discourse.specifysoftware.org/t/creating-reports-labels-in-specify-7-jaspersoft-studio/628',
    icon: icons.ticket,
    label: adminText('label'),
  },
  report: {
    mimeType: 'jrxml/report',
    name: undefined,
    documentationUrl:
      'https://discourse.specifysoftware.org/t/creating-reports-labels-in-specify-7-jaspersoft-studio/628',
    icon: icons.documentReport,
    label: adminText('report'),
  },
  userPreferences: {
    mimeType: 'application/json',
    name: 'UserPreferences',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/specify-7-user-preferences-webinar/861',
    icon: icons.cog,
    label: adminText('userPreferences'),
  },
  defaultUserPreferences: {
    mimeType: 'application/json',
    name: 'DefaultUserPreferences',
    documentationUrl:
      'https://github.com/specify/specify7/wiki/Setting-default-user-preferences',
    icon: icons.cog,
    label: adminText('defaultUserPreferences'),
  },
  leafletLayers: {
    mimeType: 'application/json',
    name: 'leaflet-layers',
    documentationUrl:
      'https://github.com/specify/specify7/wiki/Adding-Custom-Tile-Servers',
    icon: icons.locationMarker,
    label: adminText('leafletLayers'),
  },
  rssExportFeed: {
    mimeType: 'text/xml',
    name: 'ExportFeed',
    documentationUrl:
      'https://github.com/specify/specify7/wiki/Darwin-Core-Archive-Publishing',
    icon: icons.upload,
    label: adminText('rssExportFeed'),
  },
  expressSearchConfig: {
    mimeType: 'text/xml',
    name: 'ExpressSearchConfig',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/simple-search-config/183',
    icon: icons.search,
    label: adminText('expressSearchConfig'),
  },
  webLinks: {
    mimeType: 'text/xml',
    name: 'WebLinks',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/common/weblinks.xml',
    icon: icons.externalLink,
    label: adminText('webLinks'),
  },
  uiFormatters: {
    mimeType: 'text/xml',
    name: 'UIFormatters',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/backstop/uiformatters.xml',
    icon: icons.hashtag,
    label: adminText('uiFormatters'),
  },
  dataObjectFormatters: {
    mimeType: 'text/xml',
    name: 'DataObjFormatters',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/backstop/dataobj_formatters.xml',
    icon: icons.variable,
    label: adminText('dataObjectFormatters'),
  },
  searchDialogDefinitions: {
    mimeType: 'text/xml',
    name: 'DialogDefs',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/backstop/dialog_defs.xml',
    icon: icons.documentSearch,
    label: adminText('searchDialogDefinitions'),
  },
  dataEntryTables: {
    mimeType: 'text/xml',
    name: 'DataEntryTaskInit',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/fish/dataentry_task.xml',
    icon: icons.pencilAt,
    label: adminText('dataEntryTables'),
  },
  interactionsTables: {
    mimeType: 'text/xml',
    name: 'InteractionsTaskInit',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/common/interactionstask.xml',
    icon: icons.chat,
    label: adminText('interactionsTables'),
  },
  otherXmlResource: {
    mimeType: 'text/xml',
    name: undefined,
    documentationUrl: undefined,
    icon: icons.code,
    label: adminText('otherXmlResource'),
  },
  otherJsonResource: {
    mimeType: 'application/json',
    name: undefined,
    documentationUrl: undefined,
    icon: icons.adjustments,
    label: adminText('otherJsonResource'),
  },
  otherPropertiesResource: {
    mimeType: 'text/x-java-properties',
    name: undefined,
    documentationUrl: undefined,
    icon: icons.viewList,
    label: adminText('otherPropertiesResource'),
  },
  otherAppResources: {
    mimeType: undefined,
    name: undefined,
    documentationUrl: undefined,
    icon: icons.document,
    label: adminText('otherAppResource'),
  },
} as const satisfies IR<AppResourceSubType>;
