/**
 * Stores parsed data model and other useful objects for easy sharing
 * between the components of WbPlanView
 *
 * @remarks
 * The data model is cached in localStorage
 *
 * @module
 */

import type {
  DataModelTable,
  OriginalRelationships,
} from './wbplanviewmodelfetcher';
import { IR } from './types';

const dataModelStorage: {
  referenceSymbol: string;
  treeSymbol: string;
  pathJoinSymbol: string;
  tables: IR<DataModelTable>;
  originalRelationships: OriginalRelationships;
  currentCollectionId: number | undefined;
} = {
  // Each one of this can be modified to a single symbol or several symbols

  // Prefix for -to-many indexes
  referenceSymbol: '#',
  // Prefix for tree ranks
  treeSymbol: '$',
  /*
   * A symbol that is used to join multiple mapping path elements together when
   * there is a need to represent a mapping path as a string
   */
  pathJoinSymbol: '.',

  // Parsed tables and their fields
  tables: undefined!,
  /*
   * A dictionary of [original-relationship-type] > [table-name] > field-name[]
   * records for relationships that had their relationship types changed
   * using `aliasRelationshipTypes` dictionary
   */
  originalRelationships: undefined!,

  currentCollectionId: undefined,
};

export default dataModelStorage;
