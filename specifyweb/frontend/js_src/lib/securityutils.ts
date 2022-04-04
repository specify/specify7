import { ajax } from './ajax';
import type { Policy } from './components/securitypolicy';
import type { Role } from './components/securityrole';
import type { Tables } from './datamodel';
import { f } from './functools';
import { capitalize, group, lowerToHuman, toLowerCase } from './helpers';
import adminText from './localization/admin';
import commonText from './localization/common';
import queryText from './localization/query';
import type { PermissionsQueryItem } from './permissions';
import { operationPolicies, tableActions } from './permissions';
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
): Promise<RA<Role>> =>
  ajax<RA<BackEndRole>>(
    typeof userId === 'undefined'
      ? `/permissions/roles/${collectionId}/`
      : `/permissions/user_roles/${collectionId}/${userId}/`,
    {
      headers: { Accept: 'application/json' },
    }
  ).then(({ data }) =>
    data.map((role) => ({
      ...role,
      policies: processPolicies(role.policies),
    }))
  );

export const resourceToLabel = (resource: string): string =>
  resource === anyResource
    ? adminText('allResources')
    : resource.startsWith(tablePermissionsPrefix)
    ? resourceNameToModel(resource).label
    : getRegistriesFromPath(resourceNameToParts(resource))
        .map((part) => part?.label)
        .join(' ');

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
  readonly groupName: string;
};

type WritableRegistry = {
  readonly label: string;
  readonly children: R<WritableRegistry>;
  readonly actions: RA<string>;
  readonly groupName: string;
};

/** Build a registry of all permissions, their labels and possible values */
const buildRegistry = f.store(
  (): IR<Registry> =>
    [
      ...Object.values(schema.models)
        .filter(({ name }) => !f.has(toolTables(), name))
        .map(({ name, label, isSystem }) => ({
          resource: tableNameToResourceName(name),
          localized: [adminText('table'), label],
          actions: tableActions,
          groupName: isSystem ? commonText('system') : '',
        })),
      ...Object.entries(toolDefinitions()).map(([name, { label }]) => ({
        resource: partsToResourceName([toolPermissionPrefix, name]),
        localized: [commonText('tools'), label],
        actions: tableActions,
        groupName: '',
      })),
      ...Object.entries(operationPolicies).map(([resource, actions]) => ({
        resource,
        localized: resourceNameToParts(resource).map(capitalize),
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
                        label: commonText('all'),
                        children: {},
                        actions: getAllActions(
                          partsToResourceName(resourceParts.slice(0, index + 1))
                        ),
                        groupName: '',
                      },
                    },
              groupName: index + 1 === length ? groupName : '',
              actions:
                index + 1 === length
                  ? getAllActions(
                      partsToResourceName(resourceParts.slice(0, index + 1))
                    )
                  : [],
            };
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
      tables: ['SpAppResource', 'SpAppResourceData', 'SpAppResourceDir'],
    },
    pickLists: {
      label: commonText('pickList'),
      tables: ['PickList', 'PickListItem'],
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
  Object.entries(
    group(
      compressPermissionQuery(
        Object.entries(policies).flatMap(([resource, actions]) =>
          actions.map((action) => ({
            resource,
            action,
            allowed: true,
            matching_role_policies: [],
            matching_user_policies: [],
          }))
        )
      ).map(({ resource, action }) => [resource, action])
    )
  ).map(([resource, actions]) => ({ resource, actions }));

/** Convert virtual tool policies back to real system table policies */
export const decompressPolicies = (policies: RA<Policy>): IR<RA<string>> =>
  Object.fromEntries(
    policies
      .flatMap((policy) =>
        resourceNameToParts(policy.resource)[0] === toolPermissionPrefix
          ? toolDefinitions()[
              resourceNameToParts(policy.resource)[1] as keyof ReturnType<
                typeof toolDefinitions
              >
            ].tables.map((tableName) => ({
              resource: tableNameToResourceName(tableName),
              actions: policy.actions,
            }))
          : policy
      )
      .map(({ resource, actions }) => [resource, actions])
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
        if (item.resource.startsWith(tablePermissionsPrefix)) {
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

const getAllActions = (path: string): RA<string> =>
  path.startsWith(`${permissionSeparator}${toolPermissionPrefix}`)
    ? tableActions
    : f.unique(
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
