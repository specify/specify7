import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { Summary } from '../Atoms';
import { className } from '../Atoms/className';
import { userInformation } from '../InitialContext/userInformation';
import type { PermissionsQueryItem } from '../Permissions';
import { queryUserPermissions } from '../Permissions';
import { hasPermission } from '../Permissions/helpers';
import { compressPermissionQuery } from './policyConverter';
import { PreviewOperations } from './PreviewOperations';
import { PreviewTables } from './PreviewTables';

export type PreviewCell = Omit<PermissionsQueryItem, 'action'>;

export function PreviewPermissions({
  userId,
  userVersion,
  collectionId,
  changesMade,
}: {
  readonly userId: number;
  readonly userVersion: number;
  readonly collectionId: number;
  readonly changesMade: boolean;
}): JSX.Element | null {
  const [query] = useAsyncState(
    React.useCallback(
      async () =>
        (hasPermission('/permissions/policies/user', 'read', collectionId) &&
          hasPermission('/permissions/roles', 'read', collectionId)) ||
        userId === userInformation.id
          ? queryUserPermissions(userId, collectionId).then(
              compressPermissionQuery
            )
          : false,
      // Force requery user permissions when user is saved
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [userId, collectionId, userVersion]
    ),
    false
  );
  const [isCollapsed = false, setCollapsed] = useCachedState(
    'securityTool',
    'previewCollapsed'
  );
  const [isSystemCollapsed = false, setSystemCollapsed] = useCachedState(
    'securityTool',
    'advancedPreviewCollapsed'
  );

  const getOpenRoleUrl = (roleId: number): string =>
    `/specify/security/collection/${collectionId}/role/${roleId}/`;

  return query === false ? null : (
    <details open={isCollapsed}>
      <Summary className="text-xl" onToggle={setCollapsed}>
        {userText.userPermissionPreview()}
      </Summary>
      {typeof query === 'object' ? (
        <>
          {changesMade && <p>{userText.outOfDateWarning()}</p>}
          <div className="flex flex-1 flex-wrap gap-4">
            <div>
              <PreviewTables
                getOpenRoleUrl={getOpenRoleUrl}
                isSystem={false}
                query={query}
              />
              <details open={isSystemCollapsed}>
                <Summary
                  className={className.headerGray}
                  onToggle={setSystemCollapsed}
                >
                  {userText.advancedTables()}
                </Summary>
                <PreviewTables
                  getOpenRoleUrl={getOpenRoleUrl}
                  isSystem
                  query={query}
                />
              </details>
            </div>
            {/**
             * When tree node is expanded, column width increases.
             * If there isn't enough space for new width, the column is moved
             * to be below the first one. From user's perspective it looks
             * as if the column has disappeared.
             * These classNames force the second column below the first one
             * on all but the largest screens
             **/}
            <div className="xl:w-full 2xl:w-auto">
              <PreviewOperations
                getOpenRoleUrl={getOpenRoleUrl}
                query={query}
              />
            </div>
          </div>
        </>
      ) : (
        commonText.loading()
      )}
    </details>
  );
}
