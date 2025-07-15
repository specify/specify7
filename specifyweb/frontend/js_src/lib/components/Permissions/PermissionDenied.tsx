import React from 'react';

import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { AnyTree } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { formatUrl } from '../Router/queryString';
import type { toolDefinitions } from '../Security/registry';
import {
  partsToResourceName,
  tableNameToResourceName,
  toolPermissionPrefix,
} from '../Security/utils';
import type { tableActions } from './definitions';
import { FormatPermissionError } from './FormatError';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
  hasTreeAccess,
} from './helpers';
import type { getOperationPermissions } from './index';

export type PermissionErrorSchema = {
  readonly NoMatchingRuleException: RA<{
    readonly action: string;
    // This is null when accessing resource that is not scoped to a collection
    readonly collectionid: number | null;
    readonly resource: string;
    readonly userid: number;
  }>;
};

export function ToolPermissionDenied({
  tool,
  action,
}: {
  readonly tool: keyof ReturnType<typeof toolDefinitions>;
  readonly action: (typeof tableActions)[number];
}): JSX.Element {
  return (
    <PermissionError
      error={
        <FormatPermissionError
          error={[
            {
              resource: partsToResourceName([toolPermissionPrefix, tool]),
              action,
              collectionid: schema.domainLevelIds.collection,
              userid: userInformation.id,
            },
          ]}
          url={undefined}
        />
      }
      onClose={undefined}
    />
  );
}

// REFACTOR: integrate this and the following with PermissionsContext?
export function ProtectedTool({
  tool,
  action,
  children,
}: {
  readonly tool: keyof ReturnType<typeof toolDefinitions>;
  readonly action: (typeof tableActions)[number];
  readonly children: React.ReactNode;
}): JSX.Element {
  return hasToolPermission(tool, action) ? (
    <>{children}</>
  ) : (
    <ToolPermissionDenied action={action} tool={tool} />
  );
}

export function PermissionDenied<
  RESOURCE extends keyof ReturnType<typeof getOperationPermissions>[number],
>({
  resource,
  action,
}: {
  readonly resource: RESOURCE;
  readonly action: string &
    keyof ReturnType<typeof getOperationPermissions>[number][RESOURCE];
}): JSX.Element {
  return (
    <PermissionError
      error={
        <FormatPermissionError
          error={[
            {
              resource,
              action,
              collectionid: schema.domainLevelIds.collection,
              userid: userInformation.id,
            },
          ]}
          url={undefined}
        />
      }
      onClose={undefined}
    />
  );
}

export function ProtectedAction<
  RESOURCE extends keyof ReturnType<typeof getOperationPermissions>[number],
>({
  resource,
  action,
  children,
}: {
  readonly resource: RESOURCE;
  readonly action: string &
    keyof ReturnType<typeof getOperationPermissions>[number][RESOURCE];
  readonly children: React.ReactNode;
}): JSX.Element {
  return hasPermission(resource, action) ? (
    <>{children}</>
  ) : (
    <PermissionDenied action={action} resource={resource} />
  );
}

export function TablePermissionDenied({
  tableName,
  action,
}: {
  readonly tableName: keyof Tables;
  readonly action: (typeof tableActions)[number];
}): JSX.Element {
  return (
    <PermissionError
      error={
        <FormatPermissionError
          error={[
            {
              resource: tableNameToResourceName(tableName),
              action,
              collectionid: schema.domainLevelIds.collection,
              userid: userInformation.id,
            },
          ]}
          url={undefined}
        />
      }
      onClose={undefined}
    />
  );
}

export function ProtectedTable({
  tableName,
  action,
  children,
}: {
  readonly tableName: keyof Tables;
  readonly action: (typeof tableActions)[number];
  readonly children: React.ReactNode;
}): JSX.Element {
  return hasTablePermission(tableName, action) ? (
    <>{children}</>
  ) : (
    <TablePermissionDenied action={action} tableName={tableName} />
  );
}

export function ProtectedTree({
  treeName,
  action,
  children,
}: {
  readonly treeName: AnyTree['tableName'];
  readonly action: (typeof tableActions)[number];
  readonly children: JSX.Element | null;
}): JSX.Element | null {
  return hasTreeAccess(treeName, action) ? (
    children
  ) : (
    <TablePermissionDenied
      action={action}
      tableName={
        hasTablePermission(treeName, action)
          ? hasTablePermission(`${treeName}TreeDef`, action)
            ? `${treeName}TreeDefItem`
            : `${treeName}TreeDef`
          : treeName
      }
    />
  );
}

export function PermissionError({
  error,
  onClose: handleClose = (): void => globalThis.location.assign('/specify/'),
}: {
  readonly error: JSX.Element | undefined;
  readonly onClose: (() => void) | undefined;
}): JSX.Element {
  return typeof error === 'object' ? (
    <Dialog
      buttons={
        <>
          <Button.Danger
            onClick={(): void => globalThis.location.assign('/specify/')}
          >
            {commonText.goToHomepage()}
          </Button.Danger>
          {typeof handleClose === 'function' && (
            <Button.Danger onClick={handleClose}>
              {commonText.dismiss()}
            </Button.Danger>
          )}
        </>
      }
      header={userText.permissionDeniedError()}
      onClose={handleClose}
    >
      {error}
    </Dialog>
  ) : (
    <Dialog
      buttons={userText.logIn()}
      forceToTop
      header={userText.sessionTimeOut()}
      onClose={(): void =>
        globalThis.location.assign(
          formatUrl('/accounts/login/', { next: globalThis.location.href })
        )
      }
    >
      {userText.sessionTimeOutDescription()}
    </Dialog>
  );
}
