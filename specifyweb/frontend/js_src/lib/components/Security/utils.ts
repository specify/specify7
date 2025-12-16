import type { LocalizedString } from 'typesafe-i18n';

import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import {
  camelToHuman,
  lowerToHuman,
  replaceKey,
  sortFunction,
  toLowerCase,
} from '../../utils/utils';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable, tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import {
  frontEndPermissions,
  operationPolicies,
  tableActions,
} from '../Permissions/definitions';
import type { RoleBase } from './Collection';
import { processPolicies } from './policyConverter';
import { getRegistriesFromPath } from './registry';
import type { Role } from './Role';

export type BackEndRole = Omit<Role, 'policies'> & {
  readonly policies: IR<RA<string>>;
};

export const fetchRoles = async (
  collectionId: number
): Promise<RA<Role> | undefined> =>
  ajax<RA<BackEndRole>>(`/permissions/roles/${collectionId}/`, {
    headers: { Accept: 'application/json' },
    /*
     * When looking at a different collection, it is not yet know if user has
     * read permission. Instead of waiting for permission query to complete,
     * query anyway and silently handle the permission denied error
     */
    expectedErrors: [Http.FORBIDDEN],
  }).then(({ data, status }) =>
    status === Http.FORBIDDEN
      ? undefined
      : data
          .map((role) => ({
            ...role,
            policies: processPolicies(role.policies),
          }))
          .sort(sortFunction(({ name }) => name))
  );

export const fetchUserRoles = async (
  collectionId: number,
  userId: number
): Promise<RA<RoleBase> | undefined> =>
  ajax<RA<{ readonly id: number; readonly name: LocalizedString }>>(
    `/permissions/user_roles/${collectionId}/${userId}`,
    {
      headers: { Accept: 'application/json' },
      /*
       * When looking at a different collection, it is not yet know if user has
       * read permission. Instead of waiting for permission query to complete,
       * query anyway and silently handle the permission denied error
       */
      expectedErrors: [Http.FORBIDDEN],
    }
  ).then(({ data, status }) =>
    status === Http.FORBIDDEN
      ? undefined
      : data
          .map(({ id, name }) => ({ roleId: id, roleName: name }))
          /*
           * Sort all roles by ID, so that can easier detect if user roles changed
           * Since last save
           */
          .sort(sortFunction(({ roleId }) => roleId))
  );

/**
 * Convert a path like "/table/agent" into "Table > Agent"
 */
export function resourceNameToLongLabel(resource: string): string {
  const parts = resourceNameToParts(resource);
  return parts
    .map((_, index) =>
      resourceNameToLabel(partsToResourceName(parts.slice(0, index + 1)))
    )
    .join(' > ');
}

/**
 * Convert "/table" into "Table" and "/table/agent" into "Agent"
 */
export function resourceNameToLabel(resource: string): LocalizedString {
  if (
    /*
     * "getRegistriesFromPath" does not work for system tables that are part
     * of a tool, so have to handle that case here
     */
    resource.startsWith(tablePermissionsPrefix) &&
    !resource.includes(anyResource)
  )
    return resourceNameToTable(resource).label;
  else {
    const parts = resourceNameToParts(resource);
    return (
      getRegistriesFromPath(parts)[parts.length - 1]?.[parts.at(-1)!]?.label ??
      camelToHuman(resource)
    );
  }
}

/** Like getRegistriesFromPath, but excludes institutional policies */
export function getCollectionRegistriesFromPath(resourceParts: RA<string>) {
  const registries = getRegistriesFromPath(resourceParts);
  return registries.map((part, index) =>
    part === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(part).map(([resource, data]) => [
            resource,
            /*
             * Put institutional policy into a separate group, unless
             * it is selected
             */
            data.isInstitutional && resource !== resourceParts[index]
              ? replaceKey(
                  data,
                  'groupName',
                  userText.excludedInstitutionalPolicies()
                )
              : data,
          ])
        )
  );
}

/**
 * Localize action name
 */
export const actionToLabel = (action: string): LocalizedString =>
  action === anyAction ? userText.allActions() : lowerToHuman(action);

export const toolPermissionPrefix = 'tools';
export const anyAction = '%';
export const anyResource = '%';
export const permissionSeparator = '/';

export const resourceNameToParts = (resourceName: string): RA<string> =>
  resourceName.split(permissionSeparator).filter(Boolean);

export const resourceNameToTable = (resourceName: string): SpecifyTable =>
  strictGetTable(resourceNameToParts(resourceName)[1]);

export const partsToResourceName = (parts: RA<string>): string =>
  parts.length === 1 && parts[0] === anyResource
    ? anyResource
    : `${permissionSeparator}${parts.join(permissionSeparator)}`;

export const tablePermissionsPrefix = `${permissionSeparator}table${permissionSeparator}`;
export const tableNameToResourceName = <TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME
): `${typeof tablePermissionsPrefix}${Lowercase<TABLE_NAME>}` =>
  `${tablePermissionsPrefix}${toLowerCase(tableName)}`;

/**
 * Special resource that is needed by the back-end for user to be able to
 * edit anything.
 * Field level permissions are not yet fully implemented, thus this resource
 * must be hidden in the UI, but present in all policy lists
 */
export const fieldPolicy = '/field/%';

/**
 * Front-end enforces that each user that has collection access, also has the
 * following permissions:
 */
export const basicPermissions: IR<RA<string>> = {
  [fieldPolicy]: [anyAction],
};

/**
 * Get a union of all actions that can be done on descendants of a given
 * permission resource type
 */
export function getAllActions(rawPath: string): RA<string> {
  if (rawPath.startsWith(`${permissionSeparator}${toolPermissionPrefix}`))
    return tableActions;
  else {
    const parts = resourceNameToParts(rawPath);
    const path = partsToResourceName(
      parts.at(-1) === anyResource ? parts.slice(0, -1) : parts
    );
    return f.unique(
      [
        ...Object.entries(operationPolicies),
        ...Object.entries(frontEndPermissions),
        ...Object.keys(tables).map(
          (tableName) =>
            [tableNameToResourceName(tableName), tableActions] as const
        ),
      ]
        .filter(([key]) => key.startsWith(path))
        .flatMap(([_key, actions]) => actions)
    );
  }
}
