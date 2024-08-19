/**
 * Parse user permissions
 */

import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import { setDevelopmentGlobal } from '../../utils/types';
import { group, sortFunction, split } from '../../utils/utils';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import { load } from '../InitialContext';
import type { anyAction, anyResource } from '../Security/utils';
import {
  tableNameToResourceName,
  tablePermissionsPrefix,
} from '../Security/utils';
import type { derivedPolicies } from './definitions';
import {
  frontEndPermissions,
  institutionPermissions,
  operationPolicies,
  tableActions,
} from './definitions';

let operationPermissions: RR<
  number,
  RR<typeof anyResource, RR<typeof anyAction, boolean>> & {
    readonly [RESOURCE in keyof typeof frontEndPermissions]: RR<
      typeof frontEndPermissions[RESOURCE][number],
      boolean
    >;
  } & {
    readonly [RESOURCE in keyof typeof operationPolicies]: RR<
      typeof operationPolicies[RESOURCE][number],
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
export const getDerivedPermissions = () => derivedPermissions;

const sortPolicies = (policy: typeof operationPolicies) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(policy).sort(sortFunction(([key]) => key))
    )
  );

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
        sortPolicies(policies) === sortPolicies(operationPolicies)
          ? undefined
          : error(
              'Front-end list of operation policies is out of date. To resolve this error, please update "operationPolicies" in specifyweb/frontend/js_src/lib/components/Permissions/definitions.ts based on the response from the http://localhost/permissions/registry/ endpoint'
            )
      );

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
  import('../DataModel/tables')
    .then(async ({ fetchContext }) => fetchContext)
    .then(async (tables) =>
      ajax<{
        readonly details: RA<PermissionsQueryItem>;
      }>('/permissions/query/', {
        headers: { Accept: 'application/json' },
        method: 'POST',
        errorMode: 'dismissible',
        body: {
          collectionid: collectionId,
          userid: userId,
          queries: [
            ...Object.entries(operationPolicies).map(([policy, actions]) => ({
              resource: policy,
              actions,
            })),
            ...Object.keys(tables)
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
        .map(
          ({
            resource,
            matching_user_policies,
            matching_role_policies,
            ...rest
          }) => ({
            ...rest,
            resource,
            matching_user_policies: institutionPermissions.has(resource)
              ? matching_user_policies.filter(
                  ({ collectionid }) => collectionid === null
                )
              : matching_user_policies,
            /*
             * Since institutional policies can not be given in a role,
             * ignore matching_role_policies
             */
            matching_role_policies: institutionPermissions.has(resource)
              ? []
              : matching_role_policies,
          })
        )
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
): RA<readonly [string, IR<boolean>]> =>
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
      schema: import('../DataModel/schema').then(
        async ({ fetchContext }) => fetchContext
      ),
      userInformation: import('../InitialContext/userInformation').then(
        async ({ fetchContext, userInformation }) =>
          fetchContext.then(() => userInformation)
      ),
    })
    .then(async ({ schema, userInformation }) => {
      const collection = collectionId ?? schema.domainLevelIds.collection;
      if (permissionPromises[collection] === undefined)
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
            void checkRegistry();
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
            setDevelopmentGlobal('_permissions', {
              table: tablePermissions,
              operations: operationPermissions,
              derived: derivedPermissions,
            });
            return collection;
          });
      return permissionPromises[collection];
    });

export const fetchContext = fetchUserPermissions();
