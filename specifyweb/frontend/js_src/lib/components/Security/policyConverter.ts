import { filterArray, IR, R, RA, WritableArray } from '../../utils/types';
import { PermissionsQueryItem } from '../Permissions';
import { f } from '../../utils/functools';
import { group, KEY, replaceItem } from '../../utils/utils';
import { Policy } from './Policy';
import {
  anyAction,
  anyResource,
  basicPermissions,
  getAllActions,
  partsToResourceName,
  resourceNameToModel,
  resourceNameToParts,
  tableNameToResourceName,
  tablePermissionsPrefix,
  toolDefinitions,
  toolPermissionPrefix,
} from './utils';

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
      readonly policies: WritableArray<PermissionsQueryItem>;
    }>(
      ({ tools, policies }, item) => {
        if (
          item.resource.startsWith(tablePermissionsPrefix) &&
          resourceNameToParts(item.resource).at(-1) !== anyResource
        ) {
          const model = resourceNameToModel(item.resource);
          if (f.has(toolTables(), model.name)) {
            const toolName = Object.entries(toolDefinitions()).find(
              ([_name, { tables }]) => f.includes(tables, model.name)
            )?.[KEY];
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
