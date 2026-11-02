import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { queryText } from '../../localization/query';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { loadingGif } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';

type QueryShares = { readonly recipientIds: RA<number> };

export function QuerySharingActions({
  queryId,
}: {
  readonly queryId: number;
}): JSX.Element {
  const [shares, setShares] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<QueryShares>(`/stored_query/query/${queryId}/shares/`, {
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
      <Button.LikeLink
        disabled={shares === undefined}
        onClick={(): void => setMode('share')}
      >
        {queryText.shareQuery()}
      </Button.LikeLink>
      {shares !== undefined && shares.recipientIds.length > 0 && (
        <Button.LikeLink onClick={(): void => setMode('revoke')}>
          {queryText.revokeQuerySharing()}
        </Button.LikeLink>
      )}
      {mode === 'share' && shares !== undefined && (
        <QueryShareDialog
          initialRecipients={shares.recipientIds}
          queryId={queryId}
          onClose={(): void => setMode(undefined)}
          onSaved={(recipientIds): void => {
            setShares({ recipientIds });
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
                    ajax(`/stored_query/query/${queryId}/shares/`, {
                      method: 'DELETE',
                      headers: { Accept: 'text/plain' },
                    }).then(() => {
                      setShares({ recipientIds: [] });
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
  onClose,
  onSaved,
}: {
  readonly queryId: number;
  readonly initialRecipients: RA<number>;
  readonly onClose: () => void;
  readonly onSaved: (recipientIds: RA<number>) => void;
}): JSX.Element {
  const [users] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('SpecifyUser', {
          limit: 0,
          domainFilter: false,
          orderBy: 'name',
        }).then(({ records }) => records),
      []
    ),
    false
  );
  const [selected, setSelected] = React.useState(initialRecipients);
  const [review, setReview] = React.useState(false);
  const anchor = React.useRef<number>();
  const loading = React.useContext(LoadingContext);

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
                    ajax<QueryShares>(
                      `/stored_query/query/${queryId}/shares/`,
                      {
                        method: 'PUT',
                        headers: { Accept: 'application/json' },
                        body: { recipientIds: selected },
                      }
                    ).then(({ data }) => onSaved(data.recipientIds))
                  )
                }
              >
                {commonText.save()}
              </Button.Success>
            </>
          ) : (
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Success
                disabled={users === undefined}
                onClick={(): void => setReview(true)}
              >
                {commonText.save()}
              </Button.Success>
            </>
          )}
        </>
      }
      header={review ? queryText.confirmQuerySharing() : queryText.shareQuery()}
      onClose={review ? (): void => setReview(false) : onClose}
    >
      <p>
        {review
          ? queryText.confirmQuerySharingDescription()
          : queryText.querySharingDescription()}
      </p>
      {users === undefined ? (
        loadingGif
      ) : review ? (
        selected.length === 0 ? (
          <p>{queryText.noQueryRecipients()}</p>
        ) : (
          <ul>
            {users
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
              onClick={(): void => setSelected(users.map(({ id }) => id))}
            >
              {interactionsText.selectAll()}
            </Button.Secondary>
            <Button.Secondary onClick={(): void => setSelected([])}>
              {interactionsText.deselectAll()}
            </Button.Secondary>
          </div>
          <div className="flex flex-col gap-2 overflow-auto">
            {users.map(({ id, name }, index) => (
              <Label.Inline key={id}>
                <Input.Generic
                  checked={selected.includes(id)}
                  type="checkbox"
                  onChange={(event): void => {
                    const checked = event.target.checked;
                    const isRange =
                      event.nativeEvent instanceof MouseEvent &&
                      event.nativeEvent.shiftKey &&
                      anchor.current !== undefined;
                    const ids = isRange
                      ? users
                          .slice(
                            Math.min(anchor.current ?? index, index),
                            Math.max(anchor.current ?? index, index) + 1
                          )
                          .map(({ id }) => id)
                      : [id];
                    setSelected((previous) =>
                      checked
                        ? [...new Set([...previous, ...ids])]
                        : previous.filter((id) => !ids.includes(id))
                    );
                    anchor.current = index;
                  }}
                />
                {name}
              </Label.Inline>
            ))}
          </div>
        </>
      )}
    </Dialog>
  );
}
