/**
 * This module provides base structure for the description of the
 * Specify datamodel and schema. It is supplemented by the definitions
 * in specifyTable.ts and specifyField.ts in the module schema.ts
 * which actually loads and generates the schema model objects.
 */

/**
 * This module also contains scoping information indicating the
 * current collection, ..., institution information. This probably
 * belongs in a separate module because it's not really related to the
 * schema, but it's here for now.
 */

import type { RR, Writable } from '../../utils/types';
import { load } from '../InitialContext';

type Schema = {
  readonly domainLevelIds: RR<typeof domainLevels[number], number>;
  readonly embeddedCollectingEvent: boolean;
  readonly embeddedPaleoContext: boolean;
  readonly paleoContextChildTable: string;
  readonly catalogNumFormatName: string;
  readonly orgHierarchy: readonly [
    'CollectionObject',
    'Collection',
    'Discipline',
    'Division',
    'Institution'
  ];
  readonly referenceSymbol: string;
  readonly treeDefinitionSymbol: string;
  readonly treeRankSymbol: string;
  readonly fieldPartSeparator: string;
};

const schemaBase: Writable<Schema> = {
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
  // Prefix for Tree Definitions
  treeDefinitionSymbol: '%',
  // Prefix for tree ranks
  treeRankSymbol: '$',
  // Separator for partial fields (date parts in Query Builder)
  fieldPartSeparator: '-',
};

const domainLevels = [
  'collection',
  'discipline',
  'division',
  'institution',
] as const;

/*
 * REFACTOR: separate schema base (domain.json) from the rest of the schema
 * Scoping information is loaded and populated here.
 */
export const fetchContext = load<
  Omit<Schema, 'domainLevelIds'> & Schema['domainLevelIds']
>('/context/domain.json', 'application/json').then<Schema>((data) => {
  schemaBase.domainLevelIds = Object.fromEntries(
    domainLevels.map((level) => [level, data[level]])
  );
  schemaBase.embeddedCollectingEvent = data.embeddedCollectingEvent;
  schemaBase.embeddedPaleoContext = data.embeddedPaleoContext;
  schemaBase.paleoContextChildTable = data.paleoContextChildTable;
  schemaBase.catalogNumFormatName = data.catalogNumFormatName;
  return schemaBase;
});

export const schema: Schema = schemaBase;

/**
 * Convenience function for unEscaping strings from schema localization information
 */
export const unescape = (string: string): string =>
  string.replaceAll(/([^\\])\\n/gu, '$1\n');

if (process.env.NODE_ENV === 'development')
  import('../../tests/updateDataModel').catch(console.error);
