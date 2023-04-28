/**
 * Parse cell XML with a plugin definition into a JSON structure
 *
 * Documentation - https://github.com/specify/specify7/wiki/Form-System#plugin
 * On any modifications, please check if documentation needs to be updated.
 */

import type { State } from 'typesafe-reducer';

import { f } from '../../utils/functools';
import { parseRelativeDate } from '../../utils/relativeDate';
import type { RA } from '../../utils/types';
import { getParsedAttribute } from '../../utils/utils';
import { formatDisjunction } from '../Atoms/Internationalization';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import { setLogContext } from '../Errors/interceptLogs';
import type { CoordinateType } from '../FormPlugins/LatLongUi';
import { coordinateType } from '../FormPlugins/LatLongUi';
import { paleoPluginTables } from '../FormPlugins/PaleoLocation';
import type { PartialDatePrecision } from '../FormPlugins/PartialDateUi';
import { hasTablePermission } from '../Permissions/helpers';

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
    readonly cell: Element;
    readonly getProperty: (name: string) => string | undefined;
    readonly defaultValue: string | undefined;
    readonly model: SpecifyModel;
    readonly fields: RA<LiteralField | Relationship> | undefined;
  }) => UiPlugins[KEY | 'Blank' | 'WrongTable'] & {
    readonly ignoreFieldName?: boolean;
  };
} = {
  LatLonUI({ getProperty, model }) {
    if (model.name !== 'Locality')
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
  PartialDateUI({ getProperty, defaultValue, model, fields }) {
    const defaultPrecision = getProperty('defaultPrecision')?.toLowerCase();
    const dateFields = model.getFields(getProperty('df') ?? '') ?? fields;
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
      defaultValue: f.maybe(
        defaultValue?.trim().toLowerCase(),
        parseRelativeDate
      ),
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
  CollectionRelOneToManyPlugin: ({ getProperty, cell, model }) => {
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
    else if (model.name === 'CollectionObject')
      return {
        type: 'CollectionRelOneToManyPlugin',
        relationship,
        formatting: getParsedAttribute(cell, 'formatting'),
        ignoreFieldName: true,
      };
    else return { type: 'WrongTable', supportedTables: ['CollectionObject'] };
  },
  // Collection one-to-one Relationship plugin
  ColRelTypePlugin: ({ getProperty, cell, model }) => {
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
    else if (model.name === 'CollectionObject')
      return {
        type: 'ColRelTypePlugin',
        relationship,
        formatting: getParsedAttribute(cell, 'formatting'),
        ignoreFieldName: true,
      };
    else return { type: 'WrongTable', supportedTables: ['CollectionObject'] };
  },
  LocalityGeoRef: ({ model }) =>
    model.name === 'Locality'
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
  HostTaxonPlugin: ({ getProperty, model }) =>
    hasTablePermission('CollectionRelType', 'read')
      ? model.name === 'CollectingEventAttribute'
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
  LocalityGoogleEarth: ({ model }) =>
    model.name === 'Locality'
      ? { type: 'LocalityGoogleEarth', ignoreFieldName: true }
      : {
          type: 'WrongTable',
          supportedTables: ['Locality'],
        },
  PaleoMap: ({ model }) =>
    f.includes(paleoPluginTables, model.name)
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

export type PluginDefinition = UiPlugins[keyof UiPlugins];

export function parseUiPlugin({
  cell,
  getProperty,
  model,
  fields,
  ...rest
}: {
  readonly cell: Element;
  readonly getProperty: (name: string) => string | undefined;
  readonly defaultValue: string | undefined;
  readonly model: SpecifyModel;
  readonly fields: RA<LiteralField | Relationship> | undefined;
}): PluginDefinition {
  const pluginName = (getProperty('name') ?? '') as keyof UiPlugins;
  const uiCommand = processUiPlugin[pluginName] ?? processUiPlugin.Unsupported;

  setLogContext({ plugin: pluginName });
  const { ignoreFieldName, ...result } = uiCommand({
    cell,
    getProperty,
    model,
    fields,
    ...rest,
  });
  if (result.type === 'WrongTable')
    console.error(
      `Can't display ${pluginName} on ${model.name} form. Instead, try ` +
        `displaying it on the ${formatDisjunction(result.supportedTables)} form`
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

  setLogContext({ plugin: undefined });
  return result;
}
