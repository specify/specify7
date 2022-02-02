/**
 * Stores parsed data model for easy sharing between the components of
 * WbPlanView
 *
 * @module
 */

import type { IR } from './types';
import type { DataModelField } from './wbplanviewmodelfetcher';

const dataModelStorage: {
  referenceSymbol: string;
  treeSymbol: string;
  pathJoinSymbol: string;
  tables: IR<IR<DataModelField>>;
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
};

export default dataModelStorage;
