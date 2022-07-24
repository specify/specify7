import { getCache } from './cache';
import type { Tables } from './datamodel';
import type { AnyTree } from './datamodelutils';
import { f } from './functools';
import type { tableActions } from './permissions';
import {
  getDerivedPermissions,
  getOperationPermissions,
  getTablePermissions,
} from './permissions';
import { schema } from './schema';
import { tableNameToResourceName, toolDefinitions } from './securityutils';
import type { RA } from './types';
import { defined, filterArray } from './types';

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
      mappingPath.flatMap((_, index) =>
        index === 0 && ignoreBaseTable
          ? undefined
          : f.var(
              schema.models[baseTableName].getField(
                mappingPath.slice(index).join('.')
              ),
              (field) =>
                typeof field === 'object'
                  ? [
                      field.model.name,
                      field.isRelationship
                        ? field.relatedModel.name
                        : undefined,
                    ]
                  : undefined
            )
      )
    )
  );
