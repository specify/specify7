import type { IR } from './components/wbplanview';
import schema from './schema';

export const fetchingParameters: {
  readonly requiredFieldsToHide: Readonly<string[]>;
  readonly tablesToRemove: Readonly<string[]>;
  readonly tableKeywordsToExclude: Readonly<string[]>;
  readonly requiredFieldsToMakeOptional: IR<Readonly<string[]>>;
  readonly commonBaseTables: Readonly<string[]>;
  readonly fieldsToRemove: IR<Readonly<string[]>>;
} = {
  /*
   * All required fields are not hidden, except for these, which are made
   * not required
   */
  requiredFieldsToHide: [
    'timestampcreated',
    'timestampmodified',
    'createdbyagent',
    'modifiedbyagent',
    'collectionmemberid',
    'rankid',
    'defintion',
    'definitionitem',
    'ordernumber',
    'isprimary',
    'ishybrid',
    'isaccepted',
    'isloanable',
    'treedef',
  ],

  tablesToRemove: [
    'definition',
    'definitionitem',
    'geographytreedef',
    'geologictimeperiodtreedef',
    'treedef',
    'lithostrattreedefitem',
    'storagetreedefitem',
    'taxontreedefitem',
    'collectingeventattr',
    'collectionobjectattr',
    ...schema.orgHierarchy.filter(
      (tableName) => tableName !== 'collectionobject'
    ),
  ],

  // Forbid setting any of the tables that have these keywords as base tables
  tableKeywordsToExclude: [
    'Authorization',
    'Variant',
    'Attribute',
    'Property',
    'Item',
    'Definition',
    'Pnt',
    'Type',
  ],

  requiredFieldsToMakeOptional: {
    agent: ['agenttype'],
    determination: ['iscurrent'],
    loadpreparation: ['isresolved'],
    locality: ['srclatlongunit'],
  },

  // Base tables that are available by default
  commonBaseTables: [
    'accession',
    'agent',
    'borrow',
    'collectingevent',
    'collectionobject',
    'conservevent',
    'container',
    'deaccession',
    'determination',
    'dnasequence',
    'exchangein',
    'exchangeout',
    'geography',
    'gift',
    'loan',
    'locality',
    'permit',
    'preparation',
    'storage',
    'taxon',
    'treatmentevent',
  ],

  fieldsToRemove: {
    agent: ['catalogerof'],
    collectionobject: ['currentDetermination'],
    loan: [
      'totalpreps',
      'unresolvedpreps',
      'unresolveditems',
      'resolvedpreps',
      'resolveditems',
    ],
    preptype: ['isonloan'],
    token: ['preferredtaxonof'],
  },
} as const;
