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
import { schema } from './schema';
import type { anyAction, anyResource } from './securityutils';
import {
  tableNameToResourceName,
  tablePermissionsPrefix,
  toolDefinitions,
} from './securityutils';
import type { IR, RA, RR } from './types';
import { defined, filterArray } from './types';
import { fetchContext as fetchUser, userInformation } from './userinfo';

export const tableActions = ['read', 'create', 'update', 'delete'] as const;

/**
 * List of policies is stored on the front-end to improve TypeScript typing
 * In development mode, this code would still fetch the policies from the back-end
 * to make sure they haven't changed
 */
const checkRegistry = async (): Promise<void> =>
  process.env.NODE_ENV === 'production' ||
  /*
   * If already checked the registry when fetching permissions for one
   * Collection, no need to do it again for other collections
   */
  Object.keys(operationPermissions).length === 1
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
  '/permissions/policies/user': ['read', 'update'],
  '/permissions/user/roles': ['read', 'update'],
  '/permissions/roles': [
    'read',
    'create',
    'update',
    'delete',
    'copy_from_library',
  ],
  '/permissions/library/roles': ['read', 'create', 'update', 'delete'],
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
  '/preferences/user': ['edit_protected'],
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
} as const;

let operationPermissions: RR<
  number,
  {
    readonly [RESOURCE in keyof typeof operationPolicies]: RR<
      typeof operationPolicies[RESOURCE][number],
      boolean
    >;
  } & RR<typeof anyResource, RR<typeof anyAction, boolean>> & {
      readonly [RESOURCE in keyof typeof frontEndPermissions]: RR<
        typeof frontEndPermissions[RESOURCE][number],
        boolean
      >;
    }
> = {};
let tablePermissions: RR<
  number,
  {
    readonly [TABLE_NAME in keyof Tables as `${typeof tablePermissionsPrefix}${Lowercase<TABLE_NAME>}`]: RR<
      typeof tableActions[number],
      boolean
    >;
  }
> = {};
let derivedPermissions: RR<
  number,
  {
    readonly [RESOURCE in keyof typeof derivedPolicies]: RR<
      typeof derivedPolicies[RESOURCE][number],
      boolean
    >;
  }
> = {};

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
): typeof derivedPermissions[number] =>
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
  ) as typeof derivedPermissions[number];

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

const permissionPromises: Record<number, Promise<number>> = {};

/** Fetch current user permissions for a given collection */
export const fetchUserPermissions = async (
  collectionId?: number
  /*
   * Returning a number rather than void so that React can reRender the
   * SetPermissionContext when collectionId changes
   */
): Promise<number> =>
  f
    .all({
      schema: import('./schemabase').then(
        async ({ fetchContext }) => fetchContext
      ),
      fetchUser,
    })
    .then(async ({ schema }) => {
      const collection = collectionId ?? schema.domainLevelIds.collection;
      if (typeof permissionPromises[collection] === 'undefined')
        permissionPromises[collection] =
          /*
           * If fetching permissions for a non-current collection for a super
           * admin, can jsut copy permissions from the other collection as such
           * user has all permissions in all collections
           */
          (
            userInformation.isadmin &&
            collection !== schema.domainLevelIds.collection
              ? Promise.resolve({
                  operations:
                    operationPermissions[schema.domainLevelIds.collection],
                  tables: tablePermissions[schema.domainLevelIds.collection],
                  derived: derivedPermissions[schema.domainLevelIds.collection],
                })
              : queryUserPermissions(userInformation.id, collection).then(
                  (query) => {
                    const [operations, tables] = split(
                      indexQueryItems(query),
                      ([key]) => key.startsWith(tablePermissionsPrefix)
                    ).map(Object.fromEntries);
                    return {
                      operations:
                        operations as unknown as typeof operationPermissions[number],
                      tables:
                        tables as unknown as typeof tablePermissions[number],
                      derived: calculateDerivedPermissions(query),
                    };
                  }
                )
          ).then(({ operations, tables, derived }) => {
            operationPermissions = {
              ...operationPermissions,
              [collection]: operations,
            };
            tablePermissions = {
              ...tablePermissions,
              [collection]: tables,
            };
            derivedPermissions = {
              ...derivedPermissions,
              [collection]: derived,
            };
            if (process.env.NODE_ENV !== 'production') {
              // @ts-expect-error Declaring a global object
              window._permissions = {
                table: tablePermissions,
                operations: operationPermissions,
                derived: derivedPermissions,
              };
            }
            void checkRegistry();
            return collection;
          });
      return permissionPromises[collection];
    });

export const fetchContext = fetchUserPermissions();

export const hasTablePermission = (
  tableName: keyof Tables,
  action: typeof tableActions[number],
  collectionId = schema.domainLevelIds.collection
): boolean =>
  defined(tablePermissions)[collectionId][tableNameToResourceName(tableName)][
    action
  ]
    ? true
    : f.log(`No permission to ${action} ${tableName}`) ?? false;

export const hasPermission = <
  RESOURCE extends keyof typeof operationPermissions[number]
>(
  resource: RESOURCE,
  action: keyof typeof operationPermissions[number][RESOURCE],
  collectionId = schema.domainLevelIds.collection
): boolean =>
  defined(operationPermissions)[collectionId][resource][action]
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
  RESOURCE extends keyof typeof derivedPermissions[number]
>(
  resource: RESOURCE,
  action: keyof typeof derivedPermissions[number][RESOURCE],
  collectionId = schema.domainLevelIds.collection
): boolean =>
  defined(derivedPermissions)[collectionId][resource][action]
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
