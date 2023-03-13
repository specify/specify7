/**
 * This module provides base structure for the description of the
 * Specify datamodel and schema. It is supplemented by the definitions
 * in specifymodel.ts and specifyfield.ts in the module schema.ts
 * which actually loads and generates the schema model objects.
 */

/**
 * This module also contains scoping information indicating the
 * current collection, ..., institution information. This probably
 * belongs in a separate module because it's not really related to the
 * schema, but it's here for now.
 */

import type { RA, RR, Writable } from '../../utils/types';
import { load } from '../InitialContext';
import type { SpecifyModel } from './specifyModel';
import type { Tables } from './types';

export type Schema = {
  readonly domainLevelIds: RR<typeof domainLevels[number], number>;
  readonly embeddedCollectingEvent: boolean;
  readonly embeddedPaleoContext: boolean;
  readonly paleoContextChildTable: string;
  readonly catalogNumFormatName: string;
  readonly orgHierarchy: RA<keyof Tables>;
  readonly models: {
    readonly [TABLE_NAME in keyof Tables]: SpecifyModel<Tables[TABLE_NAME]>;
  };
  readonly referenceSymbol: string;
  readonly treeSymbol: string;
  readonly fieldPartSeparator: string;
  readonly pathJoinSymbol: string;
};

const schema: Writable<Schema> = {
  /*
   * Maps levels in the Specify scoping hierarchy to the database IDs of those
   * records for the currently logged in session.
   */
  domainLevelIds: undefined!,

  // Whether collectingEvent is embedded for the currently logged in collection.
  embeddedCollectingEvent: undefined!,

  // Whether PaleoContext is embedded for the currently logged in collection.
  embeddedPaleoContext: undefined!,

  paleoContextChildTable: undefined!,
  catalogNumFormatName: undefined!,
  models: {} as Schema['models'],

  // The scoping hierarchy of Specify objects.
  orgHierarchy: [
    'CollectionObject',
    'Collection',
    'Discipline',
    'Division',
    'Institution',
  ] as const,

  // Prefix for -to-many indexes
  referenceSymbol: '#',
  // Prefix for tree ranks
  treeSymbol: '$',
  // Separator for partial fields (date parts in Query Builder)
  fieldPartSeparator: '-',
  /*
   * A symbol that is used to join multiple mapping path elements together when
   * there is a need to represent a mapping path as a string
   */
  pathJoinSymbol: '.',
};

const domainLevels = [
  'collection',
  'discipline',
  'division',
  'institution',
] as const;

/*
 * Scoping information is loaded and populated here.
 */
export const fetchContext = load<
  Omit<Schema, 'domainLevelIds'> & Schema['domainLevelIds']
>('/context/domain.json', 'application/json').then((data) => {
  schema.domainLevelIds = Object.fromEntries(
    domainLevels.map((level) => [level, data[level]])
  );
  schema.embeddedCollectingEvent = data.embeddedCollectingEvent;
  schema.embeddedPaleoContext = data.embeddedPaleoContext;
  schema.paleoContextChildTable = data.paleoContextChildTable;
  schema.catalogNumFormatName = data.catalogNumFormatName;
  return schema;
});

export const schemaBase: Schema = schema;

// Convenience function for unEscaping strings from schema localization information
export const unescape = (string: string): string =>
  string.replaceAll(/([^\\])\\n/g, '$1\n');

if (process.env.NODE_ENV === 'development')
  import('../../tests/updateDataModel').catch(console.error);
