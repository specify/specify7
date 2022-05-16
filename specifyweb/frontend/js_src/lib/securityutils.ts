import { ajax, Http } from './ajax';
import type { Policy } from './components/securitypolicy';
import type { Role } from './components/securityrole';
import type { Tables } from './datamodel';
import { f } from './functools';
import { group, lowerToHuman, replaceItem, toLowerCase } from './helpers';
import { adminText } from './localization/admin';
import { commonText } from './localization/common';
import { queryText } from './localization/query';
import type { PermissionsQueryItem } from './permissions';
import {
  frontEndPermissions,
  institutionPermissions,
  operationPolicies,
  tableActions,
} from './permissions';
import { getModel, schema } from './schema';
import type { SpecifyModel } from './specifymodel';
import type { IR, R, RA } from './types';
import { defined, ensure, filterArray } from './types';

export type BackEndRole = Omit<Role, 'policies'> & {
  readonly policies: IR<RA<string>>;
};

export const fetchRoles = async (
  collectionId: number,
  userId: number | undefined
): Promise<RA<Role> | undefined> =>
  ajax<RA<BackEndRole>>(
    typeof userId === 'undefined'
      ? `/permissions/roles/${collectionId}/`
      : `/permissions/user_roles/${collectionId}/${userId}/`,
    {
      headers: { Accept: 'application/json' },
    },
    {
      expectedResponseCodes: [Http.OK, Http.FORBIDDEN],
    }
  ).then(({ data, status }) =>
    status === Http.FORBIDDEN
      ? undefined
      : data.map((role) => ({
          ...role,
          policies: processPolicies(role.policies),
        }))
  );

export const resourceNameToLabel = (resource: string): string =>
  resource.startsWith(tablePermissionsPrefix) && !resource.includes(anyResource)
    ? /*
       * "getRegistriesFromPath" does not work for system tables that are part
       * of a tool, so have to handle that case here
       */
      resourceNameToModel(resource).label
    : f.var(
        resourceNameToParts(resource),
        (parts) =>
          getRegistriesFromPath(parts)[parts.length - 1]?.[parts.slice(-1)[0]]
            .label
      ) ?? adminText('resource');

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

/**
 * Like getRegistriesFromPath, but excludes institutional policies
 */
export function getCollectionRegistriesFromPath(resourceParts: RA<string>) {
  const registries = getRegistriesFromPath(resourceParts);
  return registries.map((part, index) =>
    typeof part === 'undefined'
      ? undefined
      : Object.fromEntries(
          Object.entries(part).filter(
            ([resource, { isInstitutional }]) =>
              !isInstitutional || resource === resourceParts[index]
          )
        )
  );
}

export type Registry = {
  readonly label: string;
  readonly children: IR<Registry>;
  readonly actions: RA<string>;
  readonly groupName: string;
  readonly isInstitutional: boolean;
};

type WritableRegistry = {
  readonly label: string;
  readonly children: R<WritableRegistry>;
  readonly actions: RA<string>;
  readonly groupName: string;
  isInstitutional: boolean;
};

/** Build a registry of all permissions, their labels and possible actions */
const buildRegistry = f.store(
  (): IR<Registry> =>
    [
      ...Object.values(schema.models)
        .filter(({ name }) => !f.has(toolTables(), name))
        .map(({ name, label, overrides }) => ({
          resource: tableNameToResourceName(name),
          localized: [adminText('table'), label],
          actions: tableActions,
          groupName: overrides.isHidden ? adminText('advancedTables') : '',
        })),
      ...Object.entries(toolDefinitions()).map(([name, { label }]) => ({
        resource: partsToResourceName([toolPermissionPrefix, name]),
        localized: [commonText('tool'), label],
        actions: tableActions,
        groupName: '',
      })),
      ...Object.entries(operationPolicies).map(([resource, actions]) => ({
        resource,
        localized: resourceNameToParts(resource).map(lowerToHuman),
        actions,
        groupName: '',
      })),
      ...Object.entries(frontEndPermissions).map(([resource, actions]) => ({
        resource,
        localized: resourceNameToParts(resource).map(lowerToHuman),
        actions,
        groupName: '',
      })),
    ].reduce<R<WritableRegistry>>(
      (registry, { resource, localized, groupName }) => {
        const resourceParts = resourceNameToParts(resource);
        resourceParts.reduce<R<WritableRegistry>>(
          (place, part, index, { length }) => {
            place[part] ??= {
              label: localized[index],
              children:
                index + 1 === length
                  ? {}
                  : {
                      [anyResource]: {
                        label: tablePermissionsPrefix.includes(part)
                          ? adminText('allTables')
                          : commonText('all'),
                        children: {},
                        actions: getAllActions(
                          partsToResourceName(resourceParts.slice(0, index + 1))
                        ),
                        groupName: '',
                        isInstitutional: false,
                      },
                    },
              groupName: index + 1 === length ? groupName : '',
              actions:
                index + 1 === length
                  ? getAllActions(
                      partsToResourceName(resourceParts.slice(0, index + 1))
                    )
                  : [],
              isInstitutional: true,
            };
            if (!institutionPermissions.has(resource))
              place[part].isInstitutional = false;
            return place[part].children;
          },
          registry
        );
        return registry;
      },
      {
        [anyResource]: {
          label: commonText('all'),
          children: {},
          actions: getAllActions(partsToResourceName([])),
          groupName: '',
          isInstitutional: false,
        },
      }
    )
);

/**
 * Consolidate permissions for several system tables under a single label
 *
 * If user doesn't have some access to any of these tables, user does not
 * have access to a tool
 */
export const toolDefinitions = f.store(() =>
  ensure<
    IR<{
      readonly label: string;
      readonly tables: RA<keyof Tables>;
    }>
  >()({
    schemaConfig: {
      label: commonText('schemaConfig'),
      tables: ['SpLocaleContainer', 'SpLocaleContainerItem', 'SpLocaleItemStr'],
    },
    queryBuilder: {
      label: queryText('queryBuilder'),
      tables: ['SpQuery', 'SpQueryField'],
    },
    recordSets: {
      label: commonText('recordSets'),
      tables: ['RecordSet', 'RecordSetItem'],
    },
    resources: {
      label: commonText('appResources'),
      tables: [
        'SpAppResource',
        'SpAppResourceData',
        'SpAppResourceDir',
        'SpViewSetObj',
      ],
    },
    pickLists: {
      label: commonText('pickList'),
      tables: ['PickList', 'PickListItem'],
    },
    auditLog: {
      label: schema.models.SpAuditLog.label,
      tables: ['SpAuditLog', 'SpAuditLogField'],
    },
  } as const)
);

const toolTables = f.store(
  () =>
    new Set(Object.values(toolDefinitions()).flatMap(({ tables }) => tables))
);

/**
 * Separate out tool tables from the raw list of policies received from the
 * back-end
 */
export const processPolicies = (policies: IR<RA<string>>): RA<Policy> =>
  group(
    expandCatchAllActions(
      compressPermissionQuery(
        Object.entries(policies)
          .filter(([resource]) => resource !== fieldResource)
          .flatMap(([resource, actions]) =>
            actions.map((action) => ({
              resource: resource.toLowerCase(),
              action,
              allowed: true,
              matching_role_policies: [],
              matching_user_policies: [],
            }))
          )
      )
    ).map(({ resource, action }) => [resource, action])
  ).map(([resource, actions]) => ({ resource, actions }));

/**
 * Convert policies back to the format back-end can understand:
 * Convert virtual tool policies back to real system table policies
 * Combine separate actions on "any" resource into one policy
 * Add required policies if user has collection access
 */
export const decompressPolicies = (policies: RA<Policy>): IR<RA<string>> =>
  Object.fromEntries(
    f.var(
      // Merge actions for duplicate resources
      group(policies.map(({ resource, actions }) => [resource, actions]))
        .map(([resource, actions]) => ({ resource, actions: actions.flat() }))
        .flatMap((policy) =>
          // Separate out tool permissions into tables
          resourceNameToParts(policy.resource)[0] === toolPermissionPrefix
            ? (resourceNameToParts(policy.resource)[1] === anyResource
                ? Array.from(toolTables())
                : toolDefinitions()[
                    resourceNameToParts(policy.resource)[1] as keyof ReturnType<
                      typeof toolDefinitions
                    >
                  ].tables
              ).map((tableName) => ({
                resource: tableNameToResourceName(tableName),
                actions: policy.actions,
              }))
            : policy.resource === anyResource &&
              getAllActions(anyResource).every((action) =>
                policy.actions.includes(action)
              )
            ? {
                // Combine separate actions on "any" resource into one
                resource: anyResource,
                actions: [anyAction],
              }
            : policy
        ),
      (policies) =>
        // If has collection access, add other basic policies
        (policies.some(
          ({ resource, actions }) =>
            resource === '/system/sp7/collection' && actions.includes('access')
        )
          ? Object.entries(basicPermissions).reduce<RA<Policy>>(
              (policies, [resource, actions]) => {
                const policyIndex = policies.findIndex(
                  (policy) => policy.resource === resource
                );
                return policyIndex === -1
                  ? [
                      ...policies,
                      {
                        resource,
                        actions,
                      },
                    ]
                  : replaceItem(policies, policyIndex, {
                      ...policies[policyIndex],
                      actions: f.unique([
                        ...policies[policyIndex].actions,
                        ...actions,
                      ]),
                    });
              },
              policies
            )
          : policies
        ).map(({ resource, actions }) => [resource, actions])
    )
  );

/**
 * Like processPolicies, but works on the output of the /permission/query/
 * endpoint
 */
export const compressPermissionQuery = (
  query: RA<PermissionsQueryItem>
): RA<PermissionsQueryItem> =>
  f.var(
    query.reduce<{
      readonly tools: R<R<PermissionsQueryItem | undefined>>;
      policies: PermissionsQueryItem[];
    }>(
      ({ tools, policies }, item) => {
        if (
          item.resource.startsWith(tablePermissionsPrefix) &&
          resourceNameToParts(item.resource).slice(-1)[0] !== anyResource
        ) {
          const model = resourceNameToModel(item.resource);
          if (f.has(toolTables(), model.name)) {
            const toolName = Object.entries(toolDefinitions()).find(
              ([_name, { tables }]) => f.includes(tables, model.name)
            )?.[0];
            if (typeof toolName === 'string') {
              tools[toolName] ??= {};
              tools[toolName][item.action] = {
                action: item.action,
                resource: partsToResourceName([toolPermissionPrefix, toolName]),
                allowed: (tools[toolName][item.action] ?? true) && item.allowed,
                matching_role_policies: [
                  ...(tools[toolName][item.action]?.matching_role_policies ??
                    []),
                  ...item.matching_role_policies,
                ],
                matching_user_policies: [
                  ...(tools[toolName][item.action]?.matching_user_policies ??
                    []),
                  ...item.matching_user_policies,
                ],
              };
              return { tools, policies };
            }
          }
        }
        policies.push(item);
        return { tools, policies };
      },
      {
        tools: {},
        policies: [],
      }
    ),
    ({ tools, policies }) => [
      ...policies,
      ...Object.values(tools).flatMap((actions) =>
        filterArray(Object.values(actions)).map((item) => ({
          ...item,
          // Remove duplicate matching rules and policies
          matching_role_policies: f
            .unique(item.matching_role_policies.map(f.unary(JSON.stringify)))
            .map(f.unary(JSON.parse)),
          matching_user_policies: f
            .unique(item.matching_user_policies.map(f.unary(JSON.stringify)))
            .map(f.unary(JSON.parse)),
        }))
      ),
    ]
  );

/**
 * Expands the '%' action into separate actions allowed on that resource
 * @remarks
 * Does not expand unknown policies, as there is no way to know, which actions
 * those may have
 */
export const expandCatchAllActions = (
  rows: RA<PermissionsQueryItem>
): RA<PermissionsQueryItem> =>
  rows.flatMap((row) =>
    row.action === '%'
      ? f.var(getAllActions(row.resource), (actions) =>
          actions.length === 0
            ? row
            : actions.map((action) => ({
                ...row,
                action,
              }))
        )
      : row
  );

/**
 * Localize action name
 */
export const actionToLabel = (action: string): string =>
  action === anyAction ? adminText('allActions') : lowerToHuman(action);

export const toolPermissionPrefix = 'tools';
export const anyAction = '%';
export const anyResource = '%';
export const permissionSeparator = '/';

export const resourceNameToParts = (resourceName: string): RA<string> =>
  resourceName.split(permissionSeparator).filter(Boolean);

export const resourceNameToModel = (resourceName: string): SpecifyModel =>
  defined(getModel(resourceNameToParts(resourceName)[1]));

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
const fieldResource = '/field/%';

/**
 * Front-end enforces that each user that has collection access, also has the
 * following permissions:
 */
export const basicPermissions: IR<RA<string>> = {
  [fieldResource]: [anyAction],
};

/**
 * Get a union of all actions that can be done on descendants of a given
 * permission resource type
 */
export const getAllActions = (path: string): RA<string> =>
  path.startsWith(`${permissionSeparator}${toolPermissionPrefix}`)
    ? tableActions
    : f.var(
        f.var(resourceNameToParts(path), (parts) =>
          partsToResourceName(
            parts.slice(-1)[0] === anyResource ? parts.slice(0, -1) : parts
          )
        ),
        (path) =>
          f.unique(
            [
              ...Object.entries(operationPolicies),
              ...Object.entries(frontEndPermissions),
              ...Object.keys(schema.models).map(
                (tableName) =>
                  [tableNameToResourceName(tableName), tableActions] as const
              ),
            ]
              .filter(([key]) => key.startsWith(path))
              .flatMap(([_key, actions]) => actions)
          )
      );
