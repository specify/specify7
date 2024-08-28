/**
 * Pre-set configuration for which fields navigator should include
 */

import type { IR } from '../../utils/types';
import { ensure } from '../../utils/types';
import type { tableActions } from '../Permissions/definitions';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';

export type NavigatorSpec = {
  // Whether to include read only fields
  readonly includeReadOnly: boolean;
  // Whether no restrictions mode is enabled
  readonly isNoRestrictions: () => boolean;
  readonly includeToManyReferenceNumbers: boolean;
  readonly includeAnyTreeDefinition: boolean;
  readonly includeSpecificTreeRanks: boolean;
  readonly includeAnyTreeRank: boolean;
  readonly includeFormattedAggregated: boolean;
  // Include formatted/aggregated for the base table
  readonly includeRootFormattedAggregated: boolean;
  readonly allowTransientToMany: boolean;
  // I.e, whether to use field.isHidden or field.overrides.isHidden
  readonly useSchemaOverrides: boolean;
  // Whether to include all tree fields for non "any rank"
  readonly includeAllTreeFields: boolean;
  readonly allowNestedToMany: boolean;
  readonly ensurePermission: () => typeof tableActions[number] | undefined;
  // Whether can execute query/do workbench upload
  readonly hasActionPermission: () => boolean;
  readonly includeRelationshipsFromTree: boolean;
  readonly includeToManyToTree: boolean;
  readonly enforceRequiredFields: boolean;
  readonly includePartialDates: boolean;
};

// Navigator preset used by WorkBench Mapper
const wbPlanView: NavigatorSpec = {
  includeReadOnly: false,
  isNoRestrictions: () =>
    userPreferences.get('workBench', 'wbPlanView', 'noRestrictionsMode'),
  includeToManyReferenceNumbers: true,
  includeSpecificTreeRanks: true,
  includeAnyTreeDefinition: false,
  includeAnyTreeRank: false,
  includeFormattedAggregated: false,
  includeRootFormattedAggregated: false,
  allowTransientToMany: true,
  useSchemaOverrides: true,
  includeAllTreeFields: true,
  /*
   * Hide nested -to-many relationships as they are not
   * supported by the WorkBench
   */
  allowNestedToMany: false,
  ensurePermission: () =>
    userPreferences.get('workBench', 'wbPlanView', 'showNoAccessTables')
      ? 'create'
      : undefined,
  /*
   * If user doesn't have upload a data set, there is no need to remove
   * tables without create access from the mapper
   */
  hasActionPermission: () => hasPermission('/workbench/dataset', 'upload'),
  /*
   * Hide relationship from tree tables in WbPlanView as they
   * are not supported by the WorkBench
   */
  includeRelationshipsFromTree: false,
  /*
   * Hide -to-many relationships to a tree table as they are
   * not supported by the WorkBench
   */
  includeToManyToTree: false,
  enforceRequiredFields: true,
  includePartialDates: false,
};

// Navigator preset used by Query Builder
const queryBuilder: NavigatorSpec = {
  includeReadOnly: true,
  isNoRestrictions: () =>
    userPreferences.get('queryBuilder', 'general', 'noRestrictionsMode'),
  includeToManyReferenceNumbers: false,
  includeAnyTreeDefinition: true,
  includeSpecificTreeRanks: true,
  includeAnyTreeRank: true,
  includeFormattedAggregated: true,
  includeRootFormattedAggregated: true,
  allowTransientToMany: true,
  useSchemaOverrides: false,
  // All tree fields are only available for "any rank"
  includeAllTreeFields: false,
  allowNestedToMany: true,
  ensurePermission: () =>
    userPreferences.get('queryBuilder', 'general', 'showNoReadTables')
      ? 'read'
      : undefined,
  /*
   * Similar to the mapper: if can't run a query, no need to remove
   * tables without read access
   */
  hasActionPermission: () => hasPermission('/querybuilder/query', 'execute'),
  includeRelationshipsFromTree: true,
  includeToManyToTree: true,
  // All fields are optional in the query builder
  enforceRequiredFields: false,
  includePartialDates: true,
};

// Navigator preset used by Record Formatter Editor
const formatterEditor: NavigatorSpec = {
  includeReadOnly: true,
  isNoRestrictions: () => true,
  includeToManyReferenceNumbers: false,
  includeAnyTreeDefinition: false,
  includeSpecificTreeRanks: false,
  includeAnyTreeRank: false,
  includeFormattedAggregated: true,
  includeRootFormattedAggregated: false,
  allowTransientToMany: false,
  useSchemaOverrides: false,
  includeAllTreeFields: false,
  allowNestedToMany: false,
  ensurePermission: () => undefined,
  hasActionPermission: () => true,
  includeRelationshipsFromTree: true,
  includeToManyToTree: true,
  // All fields are optional in the query builder
  enforceRequiredFields: false,
  includePartialDates: false,
};

// Navigator preset that has zero restrictions
const permissive: NavigatorSpec = {
  includeReadOnly: true,
  isNoRestrictions: () => true,
  includeToManyReferenceNumbers: true,
  includeAnyTreeDefinition: true,
  includeSpecificTreeRanks: true,
  includeAnyTreeRank: true,
  includeFormattedAggregated: true,
  includeRootFormattedAggregated: true,
  allowTransientToMany: true,
  useSchemaOverrides: false,
  includeAllTreeFields: true,
  allowNestedToMany: true,
  ensurePermission: () => undefined,
  hasActionPermission: () => true,
  includeRelationshipsFromTree: true,
  includeToManyToTree: true,
  enforceRequiredFields: false,
  includePartialDates: true,
};

export const navigatorSpecs = ensure<IR<NavigatorSpec>>()({
  wbPlanView,
  queryBuilder,
  formatterEditor,
  permissive,
});
