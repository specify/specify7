import { ajax } from './ajax';
import { error } from './assert';
import type { Tables } from './datamodel';
import { load } from './initialcontext';
import { fetchContext as schemaPromise, schema } from './schema';
import { fetchContext as domainPromise } from './schemabase';
import {
  tableNameToResourceName,
  tablePermissionsPrefix,
  toolDefinitions,
} from './securityutils';
import type { RA, RR } from './types';
import { defined } from './types';
import { userInformation } from './userinfo';
import { f, group, split } from './wbplanviewhelper';
import { setCurrentView } from './specifyapp';
import { PermissionDenied } from './components/permissiondenied';
import createBackboneView from './components/reactbackboneextend';

export const tableActions = ['read', 'create', 'update', 'delete'] as const;

/**
 * List of policies is stored on the front-end to improve TypeScript typing
 * In development mode, the code would still fetch the policies from the back-end
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
          : error('Front-end has an outdated list of operation policies')
      );

export const operationPolicies = {
  '/tree/mutation/taxon': [
    'merge',
    'move',
    'synonymize',
    'unsynonymize',
    'repair',
  ],
  '/tree/mutation/geography': [
    'merge',
    'move',
    'synonymize',
    'unsynonymize',
    'repair',
  ],
  '/tree/mutation/storage': [
    'merge',
    'move',
    'synonymize',
    'unsynonymize',
    'repair',
  ],
  '/tree/mutation/geologictimeperiod': [
    'merge',
    'move',
    'synonymize',
    'unsynonymize',
    'repair',
  ],
  '/tree/mutation/lithostrat': [
    'merge',
    'move',
    'synonymize',
    'unsynonymize',
    'repair',
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
  '/report': ['execute'],
  '/querybuilder/query': [
    'execute',
    'export_csv',
    'export_kml',
    'create_recordset',
  ],
  '/export/dwca': ['execute'],
  '/export/feed': ['force_update'],
  '/permissions/policies/user': ['update'],
  '/permissions/user/roles': ['update'],
  '/permissions/roles': ['create', 'update', 'delete'],
} as const;

let operationPermissions: {
  readonly [RESOURCE in keyof typeof operationPolicies]: RR<
    typeof operationPolicies[RESOURCE][number],
    boolean
  >;
};
let tablePermissions: {
  readonly [TABLE_NAME in keyof Tables as `${typeof tablePermissionsPrefix}${Lowercase<TABLE_NAME>}`]: RR<
    typeof tableActions[number],
    boolean
  >;
};

export const getTablePermissions = () => tablePermissions;

export type PermissionsQuery = {
  readonly details: RA<{
    readonly action: string;
    readonly resource: string;
    readonly allowed: boolean;
    readonly matching_user_policies: RA<{
      readonly action: string;
      readonly collectionid: number | null;
      readonly resource: string;
      readonly userid: number | null;
    }>;
  }>;
};

export const queryUserPermissions = async (
  userId: number,
  collectionId: number
): Promise<PermissionsQuery> =>
  schemaPromise
    .then(() =>
      ajax<PermissionsQuery>('/permissions/query/', {
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
          ],
        },
      })
    )
    .then(({ data }) => data);

const PermissionDeniedView = createBackboneView(PermissionDenied);

export const fetchContext = domainPromise
  .then(async () =>
    queryUserPermissions(userInformation.id, schema.domainLevelIds.collection)
  )
  .then((data) =>
    split(
      Object.entries(
        group(
          data.details.map((result) => [
            result.resource,
            [result.action, result.allowed] as const,
          ])
        )
      ).map(
        ([resource, actions]) =>
          [resource, Object.fromEntries(actions)] as const
      ),
      ([key]) => key.startsWith(tablePermissionsPrefix)
    ).map(Object.fromEntries)
  )
  .then(([operations, tables]) => {
    operationPermissions = operations as unknown as typeof operationPermissions;
    tablePermissions = tables as unknown as typeof tablePermissions;
    void checkRegistry();
    if (
      schema.orgHierarchy.some(
        (tableName) =>
          tableName !== 'CollectionObject' &&
          !hasTablePermission(tableName, 'read')
      )
    ) {
      setCurrentView(new PermissionDeniedView());
      return;
    }
  });

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
) =>
  (toolDefinitions()[tool].tables as RA<keyof Tables>).every((tableName) =>
    hasTablePermission(tableName, action)
  );
