import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { StringToJsx } from '../../localization/utils';
import { f } from '../../utils/functools';
import { removeKey } from '../../utils/utils';
import type { SerializedRecord } from '../DataModel/helperTypes';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type { SpecifyUser } from '../DataModel/types';
import { toSafeObject } from '../Errors/interceptLogs';
import { format } from '../Formatters/formatters';
import { userInformation } from '../InitialContext/userInformation';
import { actionToLabel, resourceNameToLongLabel } from '../Security/utils';
import { institutionPermissions } from './definitions';
import type { PermissionErrorSchema } from './PermissionDenied';

export function formatPermissionsError(
  response: string,
  url: string
):
  | readonly [errorObject: JSX.Element | undefined, errorMessage: string]
  | undefined {
  /*
   * If this is a permission error, back-end would provide a JSON object
   * In cases of session time out, back-end returns empty response
   */
  if (response.length === 0) return [undefined, userText.sessionTimeOut()];

  let parsed: PermissionErrorSchema | undefined = undefined;
  try {
    parsed = JSON.parse(response) as PermissionErrorSchema;
  } catch {}

  const error = parsed?.NoMatchingRuleException;

  return typeof error === 'object'
    ? ([
        <FormatPermissionError error={error} url={url} />,
        [
          `Permission denied when fetching from ${url}`,
          `Response: ${JSON.stringify(toSafeObject(error), null, '\t')}`,
        ].join('\n'),
      ] as const)
    : undefined;
}

export function FormatPermissionError({
  error,
  url,
}: {
  readonly error: PermissionErrorSchema['NoMatchingRuleException'];
  readonly url: string | undefined;
}): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-2">
      <p>{userText.permissionDeniedDescription()}</p>
      <table className="grid-table grid-cols-4 rounded border border-gray-500">
        <thead>
          <tr>
            {[
              userText.action(),
              userText.resource(),
              tables.Collection.label,
              tables.SpecifyUser.label,
            ].map((label, index, { length }) => (
              <th
                className={`
                  bg-gray-350 p-2 dark:bg-neutral-600
                  ${
                    index === 0
                      ? 'rounded-l'
                      : index + 1 === length
                        ? 'rounded-r'
                        : ''
                  }
                `}
                key={index}
                scope="column"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {error.map(({ collectionid, userid, resource, action }, index) => (
            <tr key={index}>
              {[
                actionToLabel(action),
                resourceNameToLongLabel(resource),
                <CollectionName
                  collectionId={
                    institutionPermissions.has(resource)
                      ? undefined
                      : (collectionid ?? undefined)
                  }
                />,
                <UserName userId={userid} />,
              ].map((value, index) => (
                <td className="p-2" key={index}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {typeof url === 'string' && (
        <p>
          <StringToJsx
            components={{
              url: <code>{url}</code>,
            }}
            string={userText.permissionDeniedForUrl()}
          />
        </p>
      )}
    </div>
  );
}

function CollectionName({
  collectionId,
}: {
  readonly collectionId: number | undefined;
}): JSX.Element {
  const [formatted] = useAsyncState(
    React.useCallback(async () => {
      if (collectionId === undefined) return tables.Institution.label;
      const collection =
        f.maybe(
          userInformation.availableCollections.find(
            ({ id }) => id === collectionId
          ),
          deserializeResource
        ) ?? new tables.Collection.Resource({ id: collectionId });
      return format(collection, undefined, true);
    }, [collectionId]),
    false
  );
  return <>{formatted ?? commonText.loading()}</>;
}

function UserName({ userId }: { readonly userId: number }): JSX.Element {
  const [formatted] = useAsyncState(
    React.useCallback(
      async () =>
        format(
          userInformation.id === userId
            ? deserializeResource(
                serializeResource(
                  removeKey(
                    userInformation,
                    'availableCollections',
                    'isauthenticated',
                    'agent'
                  ) as SerializedRecord<SpecifyUser>
                )
              )
            : new tables.SpecifyUser.Resource({ id: userId }),
          undefined,
          true
        ),
      [userId]
    ),
    false
  );
  return <>{formatted ?? commonText.loading()}</>;
}
