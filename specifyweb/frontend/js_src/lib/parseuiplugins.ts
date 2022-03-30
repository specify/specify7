/**
 * Parse cell XML with a plugin definition into a JSON structure
 */

import type { State } from 'typesafe-reducer';

import type { PartialDatePrecision } from './components/partialdateui';
import type { IR } from './types';
import { f } from './functools';

export type UiPlugins = {
  readonly UserCollectionsUI: State<'UserCollectionsUI'>;
  readonly LatLonUI: State<
    'LatLonUI',
    {
      readonly step: number | undefined;
    }
  >;
  readonly PartialDateUI: State<
    'PartialDateUI',
    {
      readonly dateField: string | undefined;
      readonly defaultValue: 'today' | undefined;
      readonly precisionField: string | undefined;
      readonly defaultPrecision: PartialDatePrecision;
    }
  >;
  readonly CollectionRelOneToManyPlugin: State<
    'CollectionRelOneToManyPlugin',
    {
      readonly relationship: string | undefined;
    }
  >;
  readonly ColRelTypePlugin: State<
    'ColRelTypePlugin',
    {
      readonly relationship: string | undefined;
    }
  >;
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
  readonly UserAgentsUI: State<'UserAgentsUI'>;
  readonly AdminStatusUI: State<'AdminStatusUI'>;
  readonly LocalityGoogleEarth: State<'LocalityGoogleEarth'>;
  readonly PaleoMap: State<'PaleoMap'>;
  readonly Unsupported: State<
    'Unsupported',
    {
      readonly name: string | undefined;
    }
  >;
};

const processUiPlugin: {
  readonly [KEY in keyof UiPlugins]: (props: {
    readonly properties: IR<string | undefined>;
    readonly defaultValue: string | undefined;
  }) => UiPlugins[KEY];
} = {
  UserCollectionsUI: () => ({ type: 'UserCollectionsUI' }),
  LatLonUI: ({ properties }) => ({
    type: 'LatLonUI',
    step: f.parseInt(properties.step ?? ''),
  }),
  PartialDateUI: ({ properties, defaultValue }) => ({
    type: 'PartialDateUI',
    defaultValue: defaultValue?.toLowerCase() === 'today' ? 'today' : undefined,
    dateField: properties.df?.toLowerCase(),
    precisionField: properties.tp?.toLowerCase(),
    defaultPrecision: ['year', 'month-year'].includes(
      properties.defaultprecision?.toLowerCase() ?? ''
    )
      ? (properties.defaultprecision?.toLowerCase() as 'year' | 'month-year')
      : 'full',
  }),
  CollectionRelOneToManyPlugin: ({ properties }) => ({
    type: 'CollectionRelOneToManyPlugin',
    relationship: properties.relname,
  }),
  // Collection one-to-one Relationship plugin
  ColRelTypePlugin: ({ properties }) => ({
    type: 'ColRelTypePlugin',
    relationship: properties.relname,
  }),
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
  UserAgentsUI: () => ({ type: 'UserAgentsUI' }),
  AdminStatusUI: () => ({ type: 'AdminStatusUI' }),
  LocalityGoogleEarth: () => ({ type: 'LocalityGoogleEarth' }),
  PaleoMap: () => ({ type: 'PaleoMap' }),
  Unsupported: ({ properties }) => ({
    type: 'Unsupported',
    name: properties.name,
  }),
};

export type PluginDefinition = UiPlugins[keyof UiPlugins];

export function parseUiPlugin(
  properties: IR<string | undefined>,
  defaultValue: string | undefined
): PluginDefinition {
  const uiCommand =
    processUiPlugin[(properties.name ?? '') as keyof UiPlugins] ??
    processUiPlugin.Unsupported;
  return uiCommand({ properties, defaultValue });
}
