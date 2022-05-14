/**
 * Parse user permissions
 */

import { ajax } from './ajax';
import { error } from './assert';
import type { Tables } from './datamodel';
import type { AnyTree } from './datamodelutils';
import { f } from './functools';
import { group, split } from './helpers';
import { load } from './initialcontext';
import type { anyAction, anyResource } from './securityutils';
import {
  tableNameToResourceName,
  tablePermissionsPrefix,
  toolDefinitions,
} from './securityutils';
import type { IR, RA, RR } from './types';
import { defined } from './types';
import { userInformation } from './userinfo';

export const tableActions = ['read', 'create', 'update', 'delete'] as const;

/**
 * List of policies is stored on the front-end to improve TypeScript typing
 * In development mode, this code would still fetch the policies from the back-end
 * to make sure they haven't changed
 */
const checkRegistry = async (): Promise<void> =>
  process.env.NODE_ENV === 'production'
    ? Promise.resolve()
    : load<typeof operationPolicies>(
        '/permissions/registry/',
        'application/json'
      ).then((policies) =>
        JSON.stringify(policies) === JSON.stringify(operationPolicies)
          ? undefined
          : error('Front-end has outdated list of operation policies')
      );

export const collectionAccessResource = '/system/sp7/collection';
export const operationPolicies = {
  '/system/sp7/collection': ['access'],
  '/admin/user/password': ['update'],
  '/admin/user/agents': ['update'],
  '/admin/user/sp6/is_admin': ['update'],
  '/admin/user/invite_link': ['create'],
  '/admin/user/oic_providers': ['read'],
  '/admin/user/sp6/collection_access': ['read', 'update'],
  '/report': ['execute'],
  '/export/dwca': ['execute'],
  '/export/feed': ['force_update'],
  '/permissions/policies/user': ['update', 'read'],
  '/permissions/user/roles': ['update', 'read'],
  '/permissions/roles': [
    'create',
    'read',
    'update',
    'delete',
    'copy_from_library',
  ],
  '/permissions/library/roles': ['create', 'read', 'update', 'delete'],
  '/tree/edit/taxon': ['merge', 'move', 'synonymize', 'desynonymize', 'repair'],
  '/tree/edit/geography': [
    'merge',
    'move',
    'synonymize',
    'desynonymize',
    'repair',
  ],
  '/tree/edit/storage': [
    'merge',
    'move',
    'synonymize',
    'desynonymize',
    'repair',
  ],
  '/tree/edit/geologictimeperiod': [
    'merge',
    'move',
    'synonymize',
    'desynonymize',
    'repair',
  ],
  '/tree/edit/lithostrat': [
    'merge',
    'move',
    'synonymize',
    'desynonymize',
    'repair',
  ],
  '/querybuilder/query': [
    'execute',
    'export_csv',
    'export_kml',
    'create_recordset',
  ],
  '/workbench/dataset': [
    'create',
    'update',
    'delete',
    'upload',
    'unupload',
    'validate',
    'transfer',
  ],
} as const;

/**
 * These permissions have no effect on the collection level and should instead
 * be set on the institution level.
 */
export const institutionPermissions = new Set([
  '/admin/user/password',
  '/admin/user/agents',
  '/admin/user/sp6/is_admin',
  '/admin/user/invite_link',
  '/admin/user/oic_providers',
  '/admin/user/sp6/collection_access',
  '/export/feed',
  '/permissions/library/roles',
]);

/**
 * Policies that are respected on the front-end, but ignored by the back-end.
 */
export const frontEndPermissions = {
  '/preferences/user': ['edit_hidden'],
} as const;

/**
 * Front-end only policies that are not exposed in the security panel and
 * are derived based on the value of another policy.
 */
export const derivedPolicies = {
  /*
   * This is true if "/permissions/policies/user" is given on the
   * institutional level
   */
  '/permissions/institutional_policies/user': ['update', 'read'],
};

let operationPermissions: {
  readonly [RESOURCE in keyof typeof operationPolicies]: RR<
    typeof operationPolicies[RESOURCE][number],
    boolean
  >;
} & RR<typeof anyResource, RR<typeof anyAction, boolean>> & {
    readonly [RESOURCE in keyof typeof frontEndPermissions]: RR<
      typeof frontEndPermissions[RESOURCE][number],
      boolean
    >;
  };
let tablePermissions: {
  readonly [TABLE_NAME in keyof Tables as `${typeof tablePermissionsPrefix}${Lowercase<TABLE_NAME>}`]: RR<
    typeof tableActions[number],
    boolean
  >;
};
let derivedPermissions: {
  readonly [RESOURCE in keyof typeof derivedPolicies]: RR<
    typeof derivedPolicies[RESOURCE][number],
    boolean
  >;
};

export const getTablePermissions = () => tablePermissions;
export const getOperationPermissions = () => operationPermissions;

export type PermissionsQueryItem = {
  readonly action: string;
  readonly resource: string;
  readonly allowed: boolean;
  readonly matching_role_policies: RA<{
    readonly action: string;
    readonly resource: string;
    readonly roleid: number;
    readonly rolename: string;
  }>;
  readonly matching_user_policies: RA<{
    readonly action: string;
    readonly collectionid: number | null;
    readonly resource: string;
    readonly userid: number | null;
  }>;
};

export const queryUserPermissions = async (
  userId: number,
  collectionId: number
): Promise<RA<PermissionsQueryItem>> =>
  import('./schema')
    .then(async ({ fetchContext }) => fetchContext)
    .then(async (schema) =>
      ajax<{
        readonly details: RA<PermissionsQueryItem>;
      }>('/permissions/query/', {
        headers: { Accept: 'application/json' },
        method: 'POST',
        body: {
          collectionid: collectionId,
          userid: userId,
          queries: [
            ...Object.entries(operationPolicies).map(([policy, actions]) => ({
              resource: policy,
              actions,
            })),
            ...Object.keys(schema.models)
              .map(tableNameToResourceName)
              .map((resource) => ({
                resource,
                actions: tableActions,
              })),
            ...Object.entries(frontEndPermissions).map(([policy, actions]) => ({
              resource: policy,
              actions,
            })),
          ],
        },
      })
    )
    .then(({ data }) =>
      /*
       * If user has an institutional policy, make sure it is given at the
       * institutional level, as institutional policy on the collection level has
       * no effect
       */
      data.details
        .map(({ resource, matching_user_policies, ...rest }) => ({
          ...rest,
          resource,
          matching_user_policies: institutionPermissions.has(resource)
            ? matching_user_policies.filter(
                ({ collectionid }) => collectionid === null
              )
            : matching_user_policies,
        }))
        .map(({ resource, allowed, matching_user_policies, ...rest }) => ({
          ...rest,
          resource,
          matching_user_policies,
          allowed:
            allowed &&
            (!institutionPermissions.has(resource) ||
              matching_user_policies.length > 0),
        }))
    );

const calculateDerivedPermissions = (
  items: RA<PermissionsQueryItem>
): typeof derivedPermissions =>
  Object.fromEntries(
    indexQueryItems(
      items
        .filter(({ resource }) => resource === '/permissions/policies/user')
        .map(
          ({
            action,
            allowed,
            matching_user_policies,
            matching_role_policies,
          }) => ({
            resource: '/permissions/institutional_policies/user',
            action,
            allowed:
              allowed &&
              matching_user_policies.some(
                ({ collectionid }) => collectionid === null
              ),
            matching_user_policies: matching_user_policies.filter(
              ({ collectionid }) => collectionid === null
            ),
            matching_role_policies,
          })
        )
    )
  ) as typeof derivedPermissions;

const indexQueryItems = (
  query: RA<PermissionsQueryItem>
): RA<Readonly<[string, IR<boolean>]>> =>
  group(
    query.map((result) => [
      result.resource,
      [result.action, result.allowed] as const,
    ])
  ).map(
    ([resource, actions]) => [resource, Object.fromEntries(actions)] as const
  );

export const fetchContext = import('./schemabase')
  .then(async ({ fetchContext }) => fetchContext)
  .then(async (schema) =>
    queryUserPermissions(
      userInformation.id,
      schema.domainLevelIds.collection
    ).then((query) => {
      const [operations, tables] = split(indexQueryItems(query), ([key]) =>
        key.startsWith(tablePermissionsPrefix)
      ).map(Object.fromEntries);
      operationPermissions =
        operations as unknown as typeof operationPermissions;
      tablePermissions = tables as unknown as typeof tablePermissions;
      derivedPermissions = calculateDerivedPermissions(query);
      if (process.env.NODE_ENV !== 'production') {
        // @ts-expect-error Declaring a global object
        window._permissions = {
          table: tablePermissions,
          operations: operationPermissions,
        };
      }
      void checkRegistry();
    })
  );

export const hasTablePermission = (
  tableName: keyof Tables,
  action: typeof tableActions[number]
): boolean =>
  defined(tablePermissions)[tableNameToResourceName(tableName)][action]
    ? true
    : f.log(`No permission to ${action} ${tableName}`) ?? false;

export const hasPermission = <
  RESOURCE extends keyof typeof operationPermissions
>(
  resource: RESOURCE,
  action: keyof typeof operationPermissions[RESOURCE]
): boolean =>
  defined(operationPermissions)[resource][action]
    ? true
    : f.log(`No permission to ${action.toString()} ${resource}`) ?? false;

export const hasToolPermission = (
  tool: keyof ReturnType<typeof toolDefinitions>,
  action: typeof tableActions[number]
): boolean =>
  (toolDefinitions()[tool].tables as RA<keyof Tables>).every((tableName) =>
    hasTablePermission(tableName, action)
  );

export const hasTreeAccess = (
  treeName: AnyTree['tableName'],
  action: typeof tableActions[number]
): boolean =>
  hasTablePermission(treeName, action) &&
  hasTablePermission(`${treeName}TreeDef`, action) &&
  hasTablePermission(`${treeName}TreeDefItem`, action);

export const hasDerivedPermission = <
  RESOURCE extends keyof typeof derivedPermissions
>(
  resource: RESOURCE,
  action: keyof typeof derivedPermissions[RESOURCE]
): boolean =>
  defined(derivedPermissions)[resource][action]
    ? true
    : f.log(`No permission to ${action.toString()} ${resource}`) ?? false;
