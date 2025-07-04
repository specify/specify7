import type { LocalizedString } from 'typesafe-i18n';

import { preferencesText } from '../../localization/preferences';
import { reportsText } from '../../localization/report';
import { resourcesText } from '../../localization/resources';
import type { IR, RA, RR } from '../../utils/types';
import { ensure } from '../../utils/types';
import { icons } from '../Atoms/Icons';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpAppResourceDir, Tables } from '../DataModel/types';
import type { AppResourceMode } from './helpers';

export type AppResourceScope =
  | 'collection'
  | 'discipline'
  | 'global'
  | 'user'
  | 'userType';

export type AppResourceType = {
  readonly tableName: keyof Tables & ('SpAppResource' | 'SpViewSetObj');
  readonly icon: JSX.Element;
  readonly label: LocalizedString;
};

export const appResourceTypes: RR<AppResourceMode, AppResourceType> = {
  appResources: {
    tableName: 'SpAppResource',
    icon: icons.cog,
    label: resourcesText.appResource(),
  },
  viewSets: {
    tableName: 'SpViewSetObj',
    icon: icons.pencilAt,
    label: resourcesText.formDefinitions(),
  },
};

export type ScopedAppResourceDir = SerializedResource<SpAppResourceDir> & {
  readonly scope: AppResourceScope;
};

type AppResourceSubType = {
  readonly mimeType: string | undefined;
  readonly name: string | undefined;
  readonly documentationUrl: string | undefined;
  readonly icon: JSX.Element;
  readonly label: LocalizedString;
  /**
   * Whether when creating a new app resource of this type, should copy the
   * contents from an existing app resource of that type that is in current
   * scope.
   * Default value:
   * If app resource type can only have one specific name, this is true
   * Else false
   */
  readonly useTemplate?: boolean;
  /**
   * Only allow creating this app resource at certain levels
   */
  readonly scope?: RA<AppResourceScope>;
};

/**
 * The order of the subtypes matters. The filtering algorithm loops over these
 * in the order they are defined to find the first subType that matches the
 * current resource. Thus, subtypes should be sorted from the most
 * specific to the least specific.
 */
export const appResourceSubTypes = ensure<IR<AppResourceSubType>>()({
  label: {
    mimeType: 'jrxml/label',
    name: undefined,
    documentationUrl:
      'https://discourse.specifysoftware.org/t/creating-reports-labels-in-specify-7-jaspersoft-studio/628',
    icon: icons.ticket,
    label: reportsText.label(),
  },
  report: {
    mimeType: 'jrxml/report',
    name: undefined,
    documentationUrl:
      'https://discourse.specifysoftware.org/t/creating-reports-labels-in-specify-7-jaspersoft-studio/628',
    icon: icons.documentReport,
    label: reportsText.report(),
  },
  userPreferences: {
    mimeType: 'application/json',
    name: 'UserPreferences',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/specify-7-user-preferences-webinar/861',
    icon: icons.cog,
    label: preferencesText.userPreferences(),
    useTemplate: false,
    scope: ['user'],
  },
  defaultUserPreferences: {
    mimeType: 'application/json',
    name: 'DefaultUserPreferences',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/setting-default-user-preferences/1447',
    icon: icons.cog,
    label: preferencesText.defaultUserPreferences(),
  },
  // TODO: There should be useTemplate: false below? (like it is for userPreferences)
  collectionPreferences: {
    mimeType: 'application/json',
    name: 'CollectionPreferences',
    documentationUrl: undefined,
    icon: icons.cog,
    label: preferencesText.collectionPreferences(),
    scope: ['collection'],
  },
  leafletLayers: {
    mimeType: 'application/json',
    name: 'leaflet-layers',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/adding-custom-tile-servers-geomap/2593',
    icon: icons.locationMarker,
    label: resourcesText.leafletLayers(),
  },
  rssExportFeed: {
    mimeType: 'text/xml',
    name: 'ExportFeed',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/dwca-data-exporting-in-specify-7/568',
    icon: icons.upload,
    label: resourcesText.rssExportFeed(),
  },
  expressSearchConfig: {
    mimeType: 'text/xml',
    name: 'ExpressSearchConfig',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/simple-search-config/183',
    icon: icons.search,
    label: resourcesText.expressSearchConfig(),
  },
  typeSearches: {
    mimeType: 'text/xml',
    name: 'TypeSearches',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/adding-a-non-native-query-combo-box/859#h-1-type-search-definition-typesearch_defxml-8',
    icon: icons.documentSearch,
    label: resourcesText.typeSearches(),
  },
  webLinks: {
    mimeType: 'text/xml',
    name: 'WebLinks',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/editing-web-links-in-specify-7/1559',
    icon: icons.externalLink,
    label: resourcesText.webLinks(),
  },
  uiFormatters: {
    mimeType: 'text/xml',
    name: 'UIFormatters',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/backstop/uiformatters.xml',
    icon: icons.hashtag,
    label: resourcesText.uiFormatters(),
  },
  dataObjectFormatters: {
    mimeType: 'text/xml',
    name: 'DataObjFormatters',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/editing-table-formats-and-aggregations-in-specify-7/1558',
    icon: icons.variable,
    label: resourcesText.dataObjectFormatters(),
  },
  dataEntryTables: {
    mimeType: 'text/xml',
    name: 'DataEntryTaskInit',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/fish/dataentry_task.xml',
    icon: icons.pencilAt,
    label: resourcesText.dataEntryTables(),
  },
  interactionsTables: {
    mimeType: 'text/xml',
    name: 'InteractionsTaskInit',
    documentationUrl:
      'https://github.com/specify/specify6/blob/master/config/common/interactionstask.xml',
    icon: icons.chat,
    label: resourcesText.interactionsTables(),
  },
  otherXmlResource: {
    mimeType: 'text/xml',
    name: undefined,
    documentationUrl: undefined,
    icon: icons.code,
    label: resourcesText.otherXmlResource(),
  },
  otherJsonResource: {
    mimeType: 'application/json',
    name: undefined,
    documentationUrl: undefined,
    icon: icons.adjustments,
    label: resourcesText.otherJsonResource(),
  },
  otherPropertiesResource: {
    mimeType: 'text/x-java-properties',
    name: undefined,
    documentationUrl: undefined,
    icon: icons.viewList,
    label: resourcesText.otherPropertiesResource(),
  },
  otherAppResources: {
    mimeType: undefined,
    name: undefined,
    documentationUrl: undefined,
    icon: icons.document,
    label: resourcesText.otherAppResource(),
  },
} as const);
