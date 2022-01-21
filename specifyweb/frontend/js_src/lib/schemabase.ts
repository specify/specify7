/*
 * This module provides base structure for the description of the
 * Specify datamodel and schema. It is supplemented by the definitions
 * in specifymodel.ts and specifyfield.ts in the module schema.ts
 * which actually loads and generates the schema model objects.
 */

/*
 * This module also contains scoping information indicating the
 * current collection, ..., institution information. This probably
 * belongs in a separate module because it's not really related to the
 * schema, but it's here for now.
 */

import type { Tables } from './datamodel';
import { load } from './initialcontext';
import type SpecifyModel from './specifymodel';
import type { RA, RR, Writable } from './types';

export type Schema = {
  readonly domainLevelIds: RR<typeof domainLevels[number], number>;
  readonly embeddedCollectingEvent: boolean;
  readonly embeddedPaleoContext: boolean;
  readonly paleoContextChildTable: string;
  readonly catalogNumFormatName: string;
  readonly orgHierarchy: RA<string>;
  readonly models: {
    readonly [tableName in keyof Tables]: SpecifyModel<Tables[tableName]>;
  };
};

const schemaBase: Writable<Schema> = {
  /*
   * Maps levels in the Specify scoping hierarchy to
   * The database ids of those records for the currently
   * Logged in session.
   */
  domainLevelIds: undefined!,

  /*
   * Whether collectingEvent is embedded for the
   * Currently logged in collection.
   */
  embeddedCollectingEvent: undefined!,

  /*
   * Whether PaleoContext is embedded for the
   * Currently logged in collection.
   */
  embeddedPaleoContext: undefined!,

  paleoContextChildTable: undefined!,
  catalogNumFormatName: undefined!,
  models: {} as Schema['models'],

  // The scoping hierarchy of Specify objects.
  orgHierarchy: [
    'collectionobject',
    'collection',
    'discipline',
    'division',
    'institution',
  ],
};

const domainLevels = [
  'collection',
  'discipline',
  'division',
  'institution',
] as const;

// Scoping information is loaded and populated here.
export const fetchContext = load<
  Omit<Schema, 'domainLevelIds'> & Schema['domainLevelIds']
>('/context/domain.json', 'application/json').then((data) => {
  schemaBase.domainLevelIds = Object.fromEntries(
    domainLevels.map((level) => [level, data[level]])
  ) as Schema['domainLevelIds'];
  schemaBase.embeddedCollectingEvent = data.embeddedCollectingEvent;
  schemaBase.embeddedPaleoContext = data.embeddedPaleoContext;
  schemaBase.paleoContextChildTable = data.paleoContextChildTable;
  schemaBase.catalogNumFormatName = data.catalogNumFormatName;
});

export default schemaBase as Schema;

// Convenience function for unEscaping strings from schema localization information.
export const unescape = (string: string): string =>
  string.replace(/([^\\])\\n/g, '$1\n');
