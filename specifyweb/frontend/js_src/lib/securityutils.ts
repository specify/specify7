import { ajax } from './ajax';
import type { Role } from './components/securityrole';
import adminText from './localization/admin';
import { operationPolicies, tableActions } from './permissions';
import { schema } from './schema';
import type { IR, R, RA } from './types';
import { capitalize, f, toLowerCase } from './wbplanviewhelper';
import { Policy } from './components/securitypolicy';
import { Tables } from './datamodel';

export const fetchRoles = async (
  collectionId: number,
  userId: number | undefined
): Promise<RA<Role>> =>
  ajax<RA<Role>>(
    typeof userId === 'undefined'
      ? `/permissions/roles/${collectionId}/`
      : `/permissions/user_roles/${collectionId}/${userId}/`,
    {
      headers: { Accept: 'application/json' },
    }
  ).then(({ data }) => data);

/**
 * Convert a part like ['table','locality'] to an array of information for
 * each item
 */
export const getRegistriesFromPath = (
  resourceParts: RA<string>
): RA<IR<Registry> | undefined> =>
  resourceParts.reduce<RA<IR<Registry> | undefined>>(
    (parts, part) => [...parts, parts.slice(-1)[0]?.[part]?.children],
    [buildRegistry()]
  );

export type Registry = {
  readonly label: string;
  readonly children: IR<Registry>;
  readonly actions: RA<string>;
};

type WritableRegistry = {
  readonly label: string;
  readonly children: R<WritableRegistry>;
  readonly actions: RA<string>;
};

/** Build a registry of all permissions, their labels and possible values */
const buildRegistry = f.store(
  (): IR<Registry> =>
    [
      ...Object.values(schema.models).map(({ name, label }) => ({
        resource: tableNameToResourceName(name),
        localized: [adminText('table'), label],
        actions: tableActions,
      })),
      ...Object.entries(operationPolicies).map(([resource, actions]) => ({
        resource,
        localized: resourceNameToParts(resource).map(capitalize),
        actions,
      })),
    ].reduce<R<WritableRegistry>>(
      (registry, { resource, localized, actions }) => {
        const resourceParts = resourceNameToParts(resource);
        resourceParts.reduce<R<WritableRegistry>>((place, part, index) => {
          place[part] ??= {
            label: localized[index],
            children: {},
            actions: getAllActions(
              partsToResourceName(resourceParts.slice(0, index))
            ),
          };
          return place[part].children;
        }, registry);
        return registry;
      },
      {}
    )
);

export const permissionSeparator = '/';

export const resourceNameToParts = (resourceName: string): RA<string> =>
  resourceName.split(permissionSeparator).filter(Boolean);

export const partsToResourceName = (parts: RA<string>): string =>
  `${permissionSeparator}${parts.join(
    permissionSeparator
  )}${permissionSeparator}`;

export const tablePermissionsPrefix = `${permissionSeparator}table${permissionSeparator}`;
export const tableNameToResourceName = <TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME
): `${typeof tablePermissionsPrefix}${Lowercase<TABLE_NAME>}${typeof permissionSeparator}` =>
  `${tablePermissionsPrefix}${toLowerCase(tableName)}${permissionSeparator}`;

const getAllActions = (path: string): RA<string> =>
  f.unique(
    [
      ...Object.entries(operationPolicies),
      ...Object.keys(schema.models).map(
        (tableName) =>
          [tableNameToResourceName(tableName), tableActions] as const
      ),
    ]
      .filter(([key]) => key.startsWith(path))
      .flatMap(([_key, actions]) => actions)
  );

export const removeIncompletePolicies = (policies: RA<Policy>): RA<Policy> =>
  policies.filter((policy) => policy.actions.length > 0 && policy.actions);
