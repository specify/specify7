import { getCache } from '../../utils/cache';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import type { AnyTree } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { toolDefinitions } from '../Security/registry';
import { tableNameToResourceName } from '../Security/utils';
import type { tableActions } from './definitions';
import {
  getDerivedPermissions,
  getOperationPermissions,
  getTablePermissions,
} from './index';

const isReadOnly = getCache('forms', 'readOnlyMode') === true;

// REFACTOR: use <ProtectedTable> and etc in favor of this function
/**
 * Security errors are logged so that admins can see why a particular UI
 * component is disabled or missing
 */
export function hasTablePermission(
  tableName: keyof Tables,
  action: typeof tableActions[number],
  collectionId = schema.domainLevelIds.collection
): boolean {
  if (isReadOnly && action !== 'read') return false;
  if (
    defined(getTablePermissions())[collectionId][
      tableNameToResourceName(tableName)
    ][action]
  )
    return true;
  console.log(`No permission to ${action} ${tableName}`);
  return false;
}

export const hasPermission = <
  RESOURCE extends keyof ReturnType<typeof getOperationPermissions>[number]
>(
  resource: RESOURCE,
  action: keyof ReturnType<typeof getOperationPermissions>[number][RESOURCE],
  collectionId = schema.domainLevelIds.collection
): boolean =>
  defined(getOperationPermissions())[collectionId][resource][action]
    ? true
    : f.log(`No permission to ${action.toString()} ${resource}`) ?? false;

export const hasToolPermission = (
  tool: keyof ReturnType<typeof toolDefinitions>,
  action: typeof tableActions[number],
  collectionId = schema.domainLevelIds.collection
): boolean =>
  (toolDefinitions()[tool].tables as RA<keyof Tables>).every((tableName) =>
    hasTablePermission(tableName, action, collectionId)
  );

export const hasTreeAccess = (
  treeName: AnyTree['tableName'],
  action: typeof tableActions[number],
  collectionId = schema.domainLevelIds.collection
): boolean =>
  hasTablePermission(treeName, action, collectionId) &&
  hasTablePermission(`${treeName}TreeDef`, action, collectionId) &&
  hasTablePermission(`${treeName}TreeDefItem`, action, collectionId);

export const hasDerivedPermission = <
  RESOURCE extends keyof ReturnType<typeof getDerivedPermissions>[number]
>(
  resource: RESOURCE,
  action: keyof ReturnType<typeof getDerivedPermissions>[number][RESOURCE],
  collectionId = schema.domainLevelIds.collection
): boolean =>
  defined(getDerivedPermissions())[collectionId][resource][action]
    ? true
    : f.log(`No permission to ${action.toString()} ${resource}`) ?? false;

/** Check if user has a given permission for each table in a mapping path */
export const hasPathPermission = (
  baseTableName: keyof Tables,
  mappingPath: RA<string>,
  action: typeof tableActions[number],
  collectionId = schema.domainLevelIds.collection
): boolean =>
  mappingPathToTableNames(baseTableName, mappingPath, true).every((tableName) =>
    hasTablePermission(tableName, action, collectionId)
  );

export const mappingPathToTableNames = (
  baseTableName: keyof Tables,
  mappingPath: RA<string>,
  ignoreBaseTable = false
): RA<keyof Tables> =>
  f.unique(
    filterArray(
      mappingPath.flatMap((_, index) => {
        if (index === 0 && ignoreBaseTable) return undefined;
        const field = schema.models[baseTableName].getField(
          mappingPath.slice(index).join('.')
        );
        return typeof field === 'object'
          ? [
              field.model.name,
              field.isRelationship ? field.relatedModel.name : undefined,
            ]
          : undefined;
      })
    )
  );
