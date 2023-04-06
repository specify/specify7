/**
 * Parse cell XML with a plugin definition into a JSON structure
 *
 * Documentation - https://github.com/specify/specify7/wiki/Form-System#plugin
 * On any modifications, please check if documentation needs to be updated.
 */

import type { State } from 'typesafe-reducer';

import { f } from '../../utils/functools';
import { parseAnyDate } from '../../utils/relativeDate';
import type { RA, ValueOf } from '../../utils/types';
import { localized } from '../../utils/types';
import { formatDisjunction } from '../Atoms/Internationalization';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import { addContext } from '../Errors/logContext';
import type { CoordinateType } from '../FormPlugins/LatLongUi';
import { coordinateType } from '../FormPlugins/LatLongUi';
import { paleoPluginTables } from '../FormPlugins/PaleoLocation';
import type { PartialDatePrecision } from '../FormPlugins/useDatePrecision';
import { hasTablePermission } from '../Permissions/helpers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { getParsedAttribute } from '../Syncer/xmlUtils';

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
      readonly dateFields: RA<string>;
      readonly defaultValue: Date | undefined;
      readonly precisionField: string | undefined;
      readonly defaultPrecision: PartialDatePrecision;
      readonly canChangePrecision: boolean;
    }
  >;
  readonly CollectionRelOneToManyPlugin: State<
    'CollectionRelOneToManyPlugin',
    {
      readonly relationship: string;
      readonly formatting: string | undefined;
    }
  >;
  readonly ColRelTypePlugin: State<
    'ColRelTypePlugin',
    {
      readonly relationship: string;
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
  readonly HostTaxonPlugin: State<
    'HostTaxonPlugin',
    {
      readonly relationship: string | undefined;
    }
  >;
  readonly LocalityGoogleEarth: State<'LocalityGoogleEarth'>;
  readonly PaleoMap: State<'PaleoMap'>;
  readonly WrongTable: State<
    'WrongTable',
    {
      readonly supportedTables: RA<keyof Tables>;
    }
  >;
  readonly Blank: State<'Blank'>;
  readonly Unsupported: State<
    'Unsupported',
    {
      readonly name: string | undefined;
    }
  >;
};

const processUiPlugin: {
  readonly [KEY in keyof UiPlugins]: (props: {
    readonly cell: SimpleXmlNode;
    readonly getProperty: (name: string) => string | undefined;
    readonly defaultValue: string | undefined;
    readonly table: SpecifyTable;
    readonly fields: RA<LiteralField | Relationship> | undefined;
  }) => UiPlugins[KEY | 'Blank' | 'WrongTable'] & {
    readonly ignoreFieldName?: boolean;
  };
} = {
  LatLonUI({ getProperty, table }) {
    if (table.name !== 'Locality')
      return {
        type: 'WrongTable',
        supportedTables: ['Locality'],
      };
    const latLongType = getProperty('latLongType') ?? '';
    return {
      type: 'LatLonUI',
      step: f.parseFloat(getProperty('step')),
      latLongType:
        coordinateType.find(
          (type) => type.toLowerCase() === latLongType.toLowerCase()
        ) ?? 'Point',
      ignoreFieldName: true,
    };
  },
  // FEATURE: support specifying min/max value
  PartialDateUI({ getProperty, defaultValue, table, fields }) {
    const defaultPrecision = getProperty('defaultPrecision')?.toLowerCase();
    const dateFields = table.getFields(getProperty('df') ?? '') ?? fields;
    if (dateFields === undefined) {
      console.error(
        "Can't display PartialDateUi because initialize.df is not set"
      );
      return { type: 'Blank' };
    }
    if (dateFields.at(-1)?.isRelationship === true) {
      console.error("Can't display PartialDateUi for a relationship field");
      return { type: 'Blank' };
    }

    return {
      type: 'PartialDateUI',
      defaultValue: f.maybe(defaultValue?.trim().toLowerCase(), parseAnyDate),
      dateFields: dateFields?.map(({ name }) => name),
      precisionField: getProperty('tp')?.toLowerCase(),
      defaultPrecision: f.includes(['year', 'month-year'], defaultPrecision)
        ? (defaultPrecision as 'month-year' | 'year')
        : 'full',
      canChangePrecision:
        getProperty('canChangePrecision')?.toLowerCase().trim() !== 'false',
      ignoreFieldName: false,
    };
  },
  CollectionRelOneToManyPlugin: ({ getProperty, cell, table }) => {
    const relationship = getProperty('relName');
    if (relationship === undefined) {
      console.error(
        "Can't display CollectionRelOneToManyPlugin because initialize.relname is not set"
      );
      return { type: 'Blank' };
    } else if (
      !hasTablePermission('CollectionRelationship', 'read') ||
      !hasTablePermission('CollectionRelType', 'read')
    )
      return { type: 'Blank' };
    else if (table.name === 'CollectionObject')
      return {
        type: 'CollectionRelOneToManyPlugin',
        relationship,
        formatting: getParsedAttribute(cell, 'formatting'),
        ignoreFieldName: true,
      };
    else return { type: 'WrongTable', supportedTables: ['CollectionObject'] };
  },
  // Collection one-to-one Relationship plugin
  ColRelTypePlugin: ({ getProperty, cell, table }) => {
    const relationship = getProperty('relName');
    if (relationship === undefined) {
      console.error(
        "Can't display ColRelTypePlugin because initialize.relname is not set"
      );
      return { type: 'Blank' };
    } else if (
      !hasTablePermission('CollectionRelationship', 'read') ||
      !hasTablePermission('CollectionRelType', 'read')
    )
      return { type: 'Blank' };
    else if (table.name === 'CollectionObject')
      return {
        type: 'ColRelTypePlugin',
        relationship,
        formatting: getParsedAttribute(cell, 'formatting'),
        ignoreFieldName: true,
      };
    else return { type: 'WrongTable', supportedTables: ['CollectionObject'] };
  },
  LocalityGeoRef: ({ table }) =>
    table.name === 'Locality'
      ? { type: 'LocalityGeoRef', ignoreFieldName: true }
      : {
          type: 'WrongTable',
          supportedTables: ['Locality'],
        },
  WebLinkButton: ({ getProperty }) => ({
    type: 'WebLinkButton',
    webLink: getProperty('webLink'),
    icon: getProperty('icon') ?? 'WebLink',
    ignoreFieldName: false,
  }),
  HostTaxonPlugin: ({ getProperty, table }) =>
    hasTablePermission('CollectionRelType', 'read')
      ? table.name === 'CollectingEventAttribute'
        ? {
            type: 'HostTaxonPlugin',
            relationship: getProperty('relName'),
            ignoreFieldName: true,
          }
        : {
            type: 'WrongTable',
            supportedTables: ['CollectingEventAttribute'],
          }
      : { type: 'Blank' },
  LocalityGoogleEarth: ({ table }) =>
    table.name === 'Locality'
      ? { type: 'LocalityGoogleEarth', ignoreFieldName: true }
      : {
          type: 'WrongTable',
          supportedTables: ['Locality'],
        },
  PaleoMap: ({ table }) =>
    f.includes(paleoPluginTables, table.name)
      ? { type: 'PaleoMap', ignoreFieldName: true }
      : {
          type: 'WrongTable',
          supportedTables: paleoPluginTables,
        },
  Unsupported: ({ getProperty }) => {
    console.error(`Unsupported plugin: ${getProperty('name') ?? '(null)'}`);
    return {
      type: 'Unsupported',
      name: getProperty('name'),
    };
  },
  WrongTable: () => error('WrongTable parser should not get called'),
  Blank: () => ({ type: 'Blank' }),
};

export type PluginDefinition = ValueOf<UiPlugins>;

export function parseUiPlugin({
  cell,
  getProperty,
  table,
  fields,
  ...rest
}: {
  readonly cell: SimpleXmlNode;
  readonly getProperty: (name: string) => string | undefined;
  readonly defaultValue: string | undefined;
  readonly table: SpecifyTable;
  readonly fields: RA<LiteralField | Relationship> | undefined;
}): PluginDefinition {
  const pluginName = (getProperty('name') ?? '') as keyof UiPlugins;
  const uiPlugin = processUiPlugin[pluginName] ?? processUiPlugin.Unsupported;

  addContext({ plugin: pluginName });
  const { ignoreFieldName, ...result } = uiPlugin({
    cell,
    getProperty,
    table,
    fields,
    ...rest,
  });
  if (result.type === 'WrongTable')
    console.error(
      `Can't display ${pluginName} on ${table.name} form. Instead, try ` +
        `displaying it on the ${formatDisjunction(
          result.supportedTables.map(localized)
        )} form`
    );
  if (ignoreFieldName === true && fields !== undefined)
    console.warn(
      `Field name of ${fields
        .map(({ name }) => name)
        .join(
          '.'
        )} was provided to ${pluginName}, but it is not used by the plugin.\n` +
        `If you need it for a label, consider using an id instead`
    );

  return result;
}
