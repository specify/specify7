import type { State } from 'typesafe-reducer';

import type { PartialDatePrecision } from './components/partialdateui';
import type { UiCommands } from './parseuicommands';
import type { IR } from './types';

export type UiPlugins = {
  readonly UserCollectionsUI: State<'UserCollectionsUI'>;
  readonly LatLonUI: State<'LatLonUI'>;
  readonly PartialDateUI: State<
    'PartialDateUI',
    {
      readonly dateField: string | undefined;
      readonly datePrecisionField: string | undefined;
      readonly defaultPrecision: PartialDatePrecision;
    }
  >;
  readonly CollectionRelOneToManyPlugin: State<
    'CollectionRelOneToManyPlugin',
    {
      readonly relationship: string | undefined;
    }
  >;
  readonly ColRelTypePlugin: State<'ColRelTypePlugin'>;
  readonly LocalityGeoRef: State<'LocalityGeoRef'>;
  readonly WebLinkButton: State<
    'WebLinkButton',
    {
      readonly webLink: string | undefined;
      readonly icon: string;
    }
  >;
  readonly AttachmentPlugin: State<'AttachmentPlugin'>;
  readonly HostTaxonPlugin: State<
    'HostTaxonPlugin',
    {
      readonly relationship: string | undefined;
    }
  >;
  readonly PasswordUI: State<'PasswordUI'>;
  readonly Unsupported: State<
    'Unsupported',
    {
      readonly name: string | undefined;
    }
  >;
};

/*
 *   Require('./components/usercollectionsplugin').default,
 *   require('./components/latlongui').default,
 *   require('./components/partialdateui').default,
 *   require('./collectionrelonetomanyplugin').default,
 *   require('./collectionrelonetooneplugin').default,
 *   require('./geolocateplugin').default,
 *   require('./weblinkbutton').default,
 *   require('./attachmentplugin').default,
 *   require('./hosttaxonplugin').default,
 *   require('./components/passwordplugin').default,
 *   require('./useragentsplugin').default,
 *   require('./adminstatusplugin').default,
 *   require('./leafletplugin').default,
 *   require('./paleolocationplugin').default,
 *
 */

const processUiPlugin: {
  readonly [KEY in keyof UiPlugins]: (props: {
    readonly cell: Element;
    readonly properties: IR<string>;
    readonly name: string | undefined;
    readonly defaultValue: string | undefined;
  }) => UiPlugins[KEY];
} = {
  UserCollectionsUI: () => ({ type: 'UserCollectionsUI' }),
  LatLonUI: () => ({ type: 'LatLonUI' }),
  PartialDateUI: ({ properties }) => ({
    type: 'PartialDateUI',
    dateField: properties.df.toLowerCase(),
    datePrecisionField: properties.tp.toLowerCase(),
    defaultPrecision: ['year', 'month-year'].includes(
      properties.defaultprecision.toLowerCase()
    )
      ? (properties.defaultprecision.toLowerCase() as 'year' | 'month-year')
      : 'full',
  }),
  CollectionRelOneToManyPlugin: ({ properties }) => ({
    type: 'CollectionRelOneToManyPlugin',
    relationship: properties.relname,
  }),
  ColRelTypePlugin: () => ({ type: 'ColRelTypePlugin' }),
  LocalityGeoRef: () => ({ type: 'LocalityGeoRef' }),
  WebLinkButton: ({ properties }) => ({
    type: 'WebLinkButton',
    webLink: properties.weblink,
    icon: properties.icon ?? 'WebLink',
  }),
  AttachmentPlugin: () => ({ type: 'AttachmentPlugin' }),
  HostTaxonPlugin: ({ properties }) => ({
    type: 'HostTaxonPlugin',
    relationship: properties.relname,
  }),
  PasswordUI: () => ({ type: 'PasswordUI' }),
  Unsupported: ({ name }) => ({ type: 'Unsupported', name }),
};

export type PluginDefinition = {
  readonly label: string | undefined;
  readonly pluginDefinition: UiPlugins[keyof UiPlugins];
};

export function parseUiPlugin({
  cell,
  properties,
  defaultValue,
}: {
  readonly cell: Element;
  readonly properties: IR<string>;
  readonly defaultValue: string | undefined;
}): PluginDefinition {
  const name = cell.getAttribute('name') ?? undefined;
  const uiCommand =
    processUiPlugin[(name as keyof UiCommands | undefined) ?? ''] ??
    processUiPlugin.Unsupported;
  return uiCommand({ cell, properties, name, defaultValue });
}
