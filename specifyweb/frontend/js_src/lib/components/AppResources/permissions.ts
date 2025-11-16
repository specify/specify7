import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { SpAppResource, Tables } from '../DataModel/types';
import { getOperationPermissions, getTablePermissions } from '../Permissions';
import { toolDefinitions } from '../Security/registry';
import { tableNameToResourceName } from '../Security/utils';

const COLLECTION_PREFERENCES_NAME = 'CollectionPreferences';

const getCollectionId = (): number => schema.domainLevelIds?.collection ?? -1;

type OperationPermissionMap = Record<string, Record<string, boolean>>;
type TablePermissionMap = Record<string, Record<string, boolean>>;

const getOperationPermissionMap = (): OperationPermissionMap => {
  const collectionId = getCollectionId();
  return collectionId === -1
    ? ({} as OperationPermissionMap)
    : ((getOperationPermissions()[collectionId] ??
        {}) as OperationPermissionMap);
};

const getTablePermissionMap = (): TablePermissionMap => {
  const collectionId = getCollectionId();
  return collectionId === -1
    ? ({} as TablePermissionMap)
    : ((getTablePermissions()[collectionId] ?? {}) as TablePermissionMap);
};

const hasOperationPermission = (resource: string, action: string): boolean => {
  const permissions = getOperationPermissionMap();
  return Boolean(permissions[resource]?.[action]);
};

const hasToolTablePermission = (
  tool: keyof ReturnType<typeof toolDefinitions>,
  action: 'create' | 'delete' | 'read' | 'update'
): boolean => {
  const tablePermissions = getTablePermissionMap();
  const tables = toolDefinitions()[tool].tables as RA<keyof Tables>;
  return tables.every((tableName) => {
    const resourceName = tableNameToResourceName(tableName);
    return Boolean(tablePermissions[resourceName]?.[action]);
  });
};

export const canAccessCollectionPreferencesResource = (): boolean => {
  const collectionId = getCollectionId();
  if (collectionId === -1) return true;

  const tablePermissions = getTablePermissionMap();
  const operationPermissions = getOperationPermissionMap();
  if (
    Object.keys(tablePermissions).length === 0 ||
    Object.keys(operationPermissions).length === 0
  )
    return true;

  return (
    hasToolTablePermission('resources', 'update') &&
    hasOperationPermission('/preferences/collection', 'edit_collection')
  );
};

export const filterCollectionPreferencesResources = <
  RESOURCE extends SerializedResource<SpAppResource>,
>(
  resources: RA<RESOURCE>
): RA<RESOURCE> =>
  canAccessCollectionPreferencesResource()
    ? resources
    : resources.filter(
        (resource) => resource.name !== COLLECTION_PREFERENCES_NAME
      );

export const shouldShowCollectionPreferenceSubType = (): boolean =>
  canAccessCollectionPreferencesResource();
