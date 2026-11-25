import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { interactionsText } from '../../localization/interactions';
import { queryText } from '../../localization/query';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';

type QueryShareUser = { readonly id: number; readonly name: string };
type QueryShares = {
  readonly recipientIds: RA<number>;
  readonly version: number;
  readonly collections: RA<{ readonly users: RA<QueryShareUser> }>;
  readonly usersWithoutCollection: RA<QueryShareUser>;
};
type QuerySharesUpdate = Pick<QueryShares, 'recipientIds' | 'version'>;
type QuerySharesResponse = QuerySharesUpdate &
  Partial<Pick<QueryShares, 'collections' | 'usersWithoutCollection'>> & {
    readonly folderSharing?: boolean;
  };

function hasRecipientOptions(
  shares: QuerySharesResponse | undefined
): shares is QueryShares {
  return (
    shares?.collections !== undefined &&
    shares.usersWithoutCollection !== undefined
  );
}

function QueryShareUserCheckbox({
  user,
  selected,
  setSelected,
  anchor,
}: {
  readonly user: QueryShareUser;
  readonly selected: RA<number>;
  readonly setSelected: React.Dispatch<React.SetStateAction<RA<number>>>;
  readonly anchor: React.MutableRefObject<HTMLInputElement | undefined>;
}): JSX.Element {
  const { id, name } = user;
  return (
    <Label.Inline>
      <Input.Checkbox
        checked={selected.includes(id)}
        data-query-share-user-id={id}
        onChange={(event): void => {
          const checked = event.target.checked;
          const isRange =
            event.nativeEvent instanceof MouseEvent &&
            event.nativeEvent.shiftKey &&
            anchor.current !== undefined;
          const userList = event.currentTarget.closest(
            '[data-query-share-users]'
          );
          const inputs =
            userList === null
              ? [event.currentTarget]
              : [
                  ...userList.querySelectorAll<HTMLInputElement>(
                    'input[data-query-share-user-id]'
                  ),
                ];
          const index = inputs.indexOf(event.currentTarget);
          const anchorIndex =
            anchor.current === undefined ? -1 : inputs.indexOf(anchor.current);
          const ids =
            isRange && anchorIndex >= 0
              ? inputs
                  .slice(
                    Math.min(anchorIndex, index),
                    Math.max(anchorIndex, index) + 1
                  )
                  .map(({ dataset }) =>
                    Number.parseInt(dataset.queryShareUserId ?? '', 10)
                  )
              : [id];
          setSelected((previous) =>
            checked
              ? [...new Set([...previous, ...ids])]
              : previous.filter((selectedId) => !ids.includes(selectedId))
          );
          anchor.current = event.currentTarget;
        }}
      />
      {name}
    </Label.Inline>
  );
}

export function QuerySharingActions({
  canShare,
  queryId,
  onVersionChange,
}: {
  readonly canShare: boolean;
  readonly queryId: number;
  readonly onVersionChange: (version: number) => void;
}): JSX.Element {
  const [shares, setShares] = useAsyncState<QuerySharesResponse>(
    React.useCallback(
      async () =>
        ajax<QuerySharesResponse>(`/stored_query/query/${queryId}/shares/`, {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      [queryId]
    ),
    false
  );
  const [mode, setMode] = React.useState<'share' | 'revoke'>();
  const loading = React.useContext(LoadingContext);

  return (
    <>
      {shares?.folderSharing === true && (
        <p>{queryText.folderSharingManaged()}</p>
      )}
      {canShare && shares?.folderSharing !== true && (
        <Button.LikeLink
          disabled={shares === undefined}
          onClick={(): void => setMode('share')}
        >
          {queryText.shareQuery()}
        </Button.LikeLink>
      )}
      {shares !== undefined &&
        shares.folderSharing !== true &&
        shares.recipientIds.length > 0 && (
          <Button.LikeLink onClick={(): void => setMode('revoke')}>
            {queryText.revokeQuerySharing()}
          </Button.LikeLink>
        )}
      {mode === 'share' && canShare && hasRecipientOptions(shares) && (
        <QueryShareDialog
          initialRecipients={shares.recipientIds}
          queryId={queryId}
          recipients={shares}
          onClose={(): void => setMode(undefined)}
          onReload={setShares}
          onSaved={(updated): void => {
            setShares({ ...shares, ...updated });
            onVersionChange(updated.version);
            setMode(undefined);
          }}
        />
      )}
      {mode === 'revoke' && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Danger
                onClick={(): void =>
                  loading(
                    ajax<QuerySharesUpdate>(
                      `/stored_query/query/${queryId}/shares/`,
                      {
                        method: 'DELETE',
                        headers: { Accept: 'application/json' },
                      }
                    ).then(async ({ data: revokedShares }) => {
                      setShares((current) =>
                        current === undefined
                          ? current
                          : { ...current, ...revokedShares }
                      );
                      onVersionChange(revokedShares.version);
                      const { data } = await ajax<QuerySharesResponse>(
                        `/stored_query/query/${queryId}/shares/`,
                        { headers: { Accept: 'application/json' } }
                      );
                      setShares(data);
                      setMode(undefined);
                    })
                  )
                }
              >
                {queryText.revokeQuerySharing()}
              </Button.Danger>
            </>
          }
          header={queryText.revokeQuerySharing()}
          onClose={(): void => setMode(undefined)}
        >
          <p>{queryText.revokeQuerySharingDescription()}</p>
        </Dialog>
      )}
    </>
  );
}

function QueryShareDialog({
  queryId,
  initialRecipients,
  recipients,
  onClose,
  onReload,
  onSaved,
}: {
  readonly queryId: number;
  readonly initialRecipients: RA<number>;
  readonly recipients: QueryShares;
  readonly onClose: () => void;
  readonly onReload: (shares: QueryShares) => void;
  readonly onSaved: (shares: QuerySharesUpdate) => void;
}): JSX.Element {
  const [selected, setSelected] = React.useState(initialRecipients);
  const [review, setReview] = React.useState(false);
  const [conflict, setConflict] = React.useState(false);
  const anchor = React.useRef<HTMLInputElement>();
  const loading = React.useContext(LoadingContext);
  const allUsers = React.useMemo(
    () => [
      ...new Map(
        [
          ...recipients.collections.flatMap(({ users }) => users),
          ...recipients.usersWithoutCollection,
        ].map((user) => [user.id, user])
      ).values(),
    ],
    [recipients]
  );

  return (
    <Dialog
      buttons={
        <>
          {review ? (
            <>
              <Button.Secondary onClick={(): void => setReview(false)}>
                {commonText.cancel()}
              </Button.Secondary>
              <Button.Success
                onClick={(): void =>
                  loading(
                    ajax<QuerySharesUpdate>(
                      `/stored_query/query/${queryId}/shares/`,
                      {
                        method: 'PUT',
                        headers: { Accept: 'application/json' },
                        expectedErrors: [Http.CONFLICT],
                        body: {
                          recipientIds: selected,
                          version: recipients.version,
                        },
                      }
                    ).then(async ({ data, status }) => {
                      if (status === Http.CONFLICT) {
                        const { data: current } = await ajax<QueryShares>(
                          `/stored_query/query/${queryId}/shares/`,
                          { headers: { Accept: 'application/json' } }
                        );
                        onReload(current);
                        setSelected(current.recipientIds);
                        anchor.current = undefined;
                        setReview(false);
                        setConflict(true);
                      } else onSaved(data);
                    })
                  )
                }
              >
                {commonText.save()}
              </Button.Success>
            </>
          ) : (
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Success onClick={(): void => setReview(true)}>
                {commonText.save()}
              </Button.Success>
            </>
          )}
        </>
      }
      dimensionsKey="QueryShareDialog"
      header={review ? queryText.confirmQuerySharing() : queryText.shareQuery()}
      onClose={review ? (): void => setReview(false) : onClose}
    >
      {conflict && <p role="alert">{formsText.saveConflict()}</p>}
      <p>
        {review
          ? queryText.confirmQuerySharingDescription()
          : queryText.querySharingDescription()}
      </p>
      {review ? (
        selected.length === 0 ? (
          <p>{queryText.noQueryRecipients()}</p>
        ) : (
          <ul>
            {allUsers
              .filter(({ id }) => selected.includes(id))
              .map(({ id, name }) => (
                <li key={id}>{name}</li>
              ))}
          </ul>
        )
      ) : (
        <>
          <div className="flex gap-2">
            <Button.Secondary
              onClick={(): void => setSelected(allUsers.map(({ id }) => id))}
            >
              {interactionsText.selectAll()}
            </Button.Secondary>
            <Button.Secondary onClick={(): void => setSelected([])}>
              {interactionsText.deselectAll()}
            </Button.Secondary>
          </div>
          <div
            className="flex flex-col gap-2 overflow-auto"
            data-query-share-users
          >
            {allUsers.map((user) => (
              <QueryShareUserCheckbox
                anchor={anchor}
                key={user.id}
                selected={selected}
                setSelected={setSelected}
                user={user}
              />
            ))}
          </div>
        </>
      )}
    </Dialog>
  );
}
