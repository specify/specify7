/**
 * Parse cell XML with a plugin definition into a JSON structure
 *
 * Documentation - https://github.com/specify/specify7/wiki/Form-System#plugin
 * On any modifications, please check if documentation needs to be updated.
 */

import type { State } from 'typesafe-reducer';

import { f } from '../../utils/functools';
import { parseRelativeDate } from '../../utils/relativeDate';
import type { CoordinateType } from '../FormPlugins/LatLongUi';
import { coordinateType } from '../FormPlugins/LatLongUi';
import type { PartialDatePrecision } from '../FormPlugins/PartialDateUi';
import { getParsedAttribute } from '../../utils/utils';
import {ValueOf} from '../../utils/types';

export type UiPlugins = {
  readonly LatLonUI: State<
    'LatLonUI',
    {
      readonly step: number | undefined;
      readonly latLongType: CoordinateType;
    }
  >;
  readonly PartialDateUI: State<
    'PartialDateUI',
    {
      readonly dateField: string | undefined;
      readonly defaultValue: Date | undefined;
      readonly precisionField: string | undefined;
      readonly defaultPrecision: PartialDatePrecision;
    }
  >;
  readonly CollectionRelOneToManyPlugin: State<
    'CollectionRelOneToManyPlugin',
    {
      readonly relationship: string | undefined;
      readonly formatting: string | undefined;
    }
  >;
  readonly ColRelTypePlugin: State<
    'ColRelTypePlugin',
    {
      readonly relationship: string | undefined;
      readonly formatting: string | undefined;
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
    readonly cell: Element;
    readonly getProperty: (name: string) => string | undefined;
    readonly defaultValue: string | undefined;
  }) => UiPlugins[KEY];
} = {
  LatLonUI({ getProperty }) {
    const latLongType = getProperty('latLongType') ?? '';
    return {
      type: 'LatLonUI',
      step: f.parseFloat(getProperty('step')),
      latLongType:
        coordinateType.find(
          (type) => type.toLowerCase() === latLongType.toLowerCase()
        ) ?? 'Point',
    };
  },
  PartialDateUI({ getProperty, defaultValue }) {
    const defaultPrecision = getProperty('defaultPrecision')?.toLowerCase();
    return {
      type: 'PartialDateUI',
      defaultValue: f.maybe(
        defaultValue?.trim().toLowerCase(),
        parseRelativeDate
      ),
      dateField: getProperty('df')?.toLowerCase(),
      precisionField: getProperty('tp')?.toLowerCase(),
      defaultPrecision: f.includes(['year', 'month-year'], defaultPrecision)
        ? (defaultPrecision as 'month-year' | 'year')
        : 'full',
    };
  },
  CollectionRelOneToManyPlugin: ({ getProperty, cell }) => ({
    type: 'CollectionRelOneToManyPlugin',
    relationship: getProperty('relName'),
    formatting: getParsedAttribute(cell, 'formatting'),
  }),
  // Collection one-to-one Relationship plugin
  ColRelTypePlugin: ({ getProperty, cell }) => ({
    type: 'ColRelTypePlugin',
    relationship: getProperty('relName'),
    formatting: getParsedAttribute(cell, 'formatting'),
  }),
  LocalityGeoRef: () => ({ type: 'LocalityGeoRef' }),
  WebLinkButton: ({ getProperty }) => ({
    type: 'WebLinkButton',
    webLink: getProperty('webLink'),
    icon: getProperty('icon') ?? 'WebLink',
  }),
  AttachmentPlugin: () => ({ type: 'AttachmentPlugin' }),
  HostTaxonPlugin: ({ getProperty }) => ({
    type: 'HostTaxonPlugin',
    relationship: getProperty('relName'),
  }),
  LocalityGoogleEarth: () => ({ type: 'LocalityGoogleEarth' }),
  PaleoMap: () => ({ type: 'PaleoMap' }),
  Unsupported: ({ getProperty }) => ({
    type: 'Unsupported',
    name: getProperty('name'),
  }),
};

export type PluginDefinition = ValueOf<UiPlugins>;

export function parseUiPlugin(
  cell: Element,
  getProperty: (name: string) => string | undefined,
  defaultValue: string | undefined
): PluginDefinition {
  const uiCommand =
    processUiPlugin[(getProperty('name') ?? '') as keyof UiPlugins] ??
    processUiPlugin.Unsupported;
  return uiCommand({ cell, getProperty, defaultValue });
}
