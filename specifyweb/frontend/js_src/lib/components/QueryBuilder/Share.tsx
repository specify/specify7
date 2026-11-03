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
import { tables } from '../DataModel/tables';
import { Dialog } from '../Molecules/Dialog';
import { CollapsibleSection } from '../SystemConfigurationTool/CollapsibleSection';
import {
  colorByKind,
  type HierarchyNodeKind,
} from '../SystemConfigurationTool/hierarchyColors';

type QueryShareUser = { readonly id: number; readonly name: string };
type QueryShareNode = { readonly id: number; readonly name: string };
type QueryShareCollection = QueryShareNode & {
  readonly discipline: QueryShareNode & { readonly division: QueryShareNode };
  readonly users: RA<QueryShareUser>;
};
type QueryShares = {
  readonly recipientIds: RA<number>;
  readonly collections: RA<QueryShareCollection>;
  readonly usersWithoutCollection: RA<QueryShareUser>;
};
type QuerySharesUpdate = Pick<QueryShares, 'recipientIds'>;

function groupBy<ITEM>(
  items: RA<ITEM>,
  getParent: (item: ITEM) => QueryShareNode
): RA<QueryShareNode & { readonly children: RA<ITEM> }> {
  return items.reduce<RA<QueryShareNode & { readonly children: RA<ITEM> }>>(
    (groups, item) => {
      const parent = getParent(item);
      return groups.some(({ id }) => id === parent.id)
        ? groups.map((group) =>
            group.id === parent.id
              ? { ...group, children: [...group.children, item] }
              : group
          )
        : [...groups, { id: parent.id, name: parent.name, children: [item] }];
    },
    []
  );
}

function QueryShareSectionTitle({
  kind,
  label,
  name,
}: {
  readonly kind: HierarchyNodeKind;
  readonly label: string;
  readonly name: string;
}): JSX.Element {
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-semibold" style={{ color: colorByKind[kind] }}>
        {label}:
      </span>
      <span>{name}</span>
    </span>
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
          recipients={shares}
          onClose={(): void => setMode(undefined)}
          onSaved={(recipientIds): void => {
            setShares({ ...shares, recipientIds });
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
                      setShares((current) =>
                        current === undefined
                          ? current
                          : { ...current, recipientIds: [] }
                      );
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
  onSaved,
}: {
  readonly queryId: number;
  readonly initialRecipients: RA<number>;
  readonly recipients: QueryShares;
  readonly onClose: () => void;
  readonly onSaved: (recipientIds: RA<number>) => void;
}): JSX.Element {
  const [selected, setSelected] = React.useState(initialRecipients);
  const [review, setReview] = React.useState(false);
  const anchor = React.useRef<HTMLInputElement>();
  const loading = React.useContext(LoadingContext);
  const allUsers = React.useMemo(
    () =>
      [
        ...recipients.collections.flatMap(({ users }) => users),
        ...recipients.usersWithoutCollection,
      ].filter(
        (user, index, users) =>
          users.findIndex(({ id }) => id === user.id) === index
      ),
    [recipients]
  );
  const divisions = React.useMemo(
    () =>
      groupBy(
        groupBy(recipients.collections, ({ discipline }) => discipline),
        ({ children }) => children[0].discipline.division
      ),
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
              <Button.Success onClick={(): void => setReview(true)}>
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
            {divisions.map((division) => (
              <CollapsibleSection
                hasChildren={division.children.length > 0}
                key={division.id}
                title={
                  <QueryShareSectionTitle
                    kind="division"
                    label={tables.Division.label}
                    name={division.name}
                  />
                }
              >
                <div className="mt-2 flex flex-col gap-2">
                  {division.children.map((discipline) => (
                    <CollapsibleSection
                      hasChildren={discipline.children.length > 0}
                      key={discipline.id}
                      title={
                        <QueryShareSectionTitle
                          kind="discipline"
                          label={tables.Discipline.label}
                          name={discipline.name}
                        />
                      }
                    >
                      <div className="mt-2 flex flex-col gap-2">
                        {discipline.children.map((collection) => (
                          <CollapsibleSection
                            hasChildren={collection.users.length > 0}
                            key={collection.id}
                            title={
                              <QueryShareSectionTitle
                                kind="collection"
                                label={tables.Collection.label}
                                name={collection.name}
                              />
                            }
                          >
                            <div className="mt-2 flex flex-col gap-2">
                              {collection.users.map((user) => (
                                <QueryShareUserCheckbox
                                  anchor={anchor}
                                  key={user.id}
                                  selected={selected}
                                  setSelected={setSelected}
                                  user={user}
                                />
                              ))}
                            </div>
                          </CollapsibleSection>
                        ))}
                      </div>
                    </CollapsibleSection>
                  ))}
                </div>
              </CollapsibleSection>
            ))}
            {recipients.usersWithoutCollection.length > 0 && (
              <CollapsibleSection
                hasChildren
                title={queryText.usersWithoutCollection()}
              >
                <div className="mt-2 flex flex-col gap-2">
                  {recipients.usersWithoutCollection.map((user) => (
                    <QueryShareUserCheckbox
                      anchor={anchor}
                      key={user.id}
                      selected={selected}
                      setSelected={setSelected}
                      user={user}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}
