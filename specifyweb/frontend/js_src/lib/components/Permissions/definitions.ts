export const tableActions = ['read', 'create', 'update', 'delete'] as const;
export const collectionAccessResource = '/system/sp7/collection';
export const operationPolicies = {
  '/admin/user/agents': ['update'],
  '/admin/user/invite_link': ['create'],
  '/admin/user/oic_providers': ['read'],
  '/admin/user/password': ['update'],
  '/admin/user/sp6/collection_access': ['read', 'update'],
  '/admin/user/sp6/is_admin': ['update'],
  '/attachment_import/dataset': [
    'create',
    'update',
    'delete',
    'upload',
    'rollback',
  ],
  '/export/dwca': ['execute'],
  '/export/feed': ['force_update'],
  '/permissions/library/roles': ['read', 'create', 'update', 'delete'],
  '/permissions/list_admins': ['read'],
  '/permissions/policies/user': ['read', 'update'],
  '/permissions/roles': [
    'read',
    'create',
    'update',
    'delete',
    'copy_from_library',
  ],
  '/permissions/user/roles': ['read', 'update'],
  '/querybuilder/query': [
    'execute',
    'export_csv',
    'export_kml',
    'create_recordset',
  ],
  '/record/merge': ['update', 'delete'],
  '/report': ['execute'],
  '/system/sp7/collection': ['access'],
  '/tree/edit/geography': [
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
  '/tree/edit/storage': [
    'merge',
    'move',
    'bulk_move',
    'synonymize',
    'desynonymize',
    'repair',
  ],
  '/tree/edit/taxon': ['merge', 'move', 'synonymize', 'desynonymize', 'repair'],
  '/tree/edit/tectonicunit': [
    'merge',
    'move',
    'synonymize',
    'desynonymize',
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
    'create_recordset',
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
  '/permissions/list_admins',
  '/report/record',
]);

/**
 * Policies that are respected on the front-end, but ignored by the back-end.
 */
export const frontEndPermissions = {
  '/preferences/user': ['edit_protected'],
  '/preferences/statistics': ['edit_shared'],
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
