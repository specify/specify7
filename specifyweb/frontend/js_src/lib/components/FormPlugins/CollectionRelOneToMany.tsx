import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { State } from 'typesafe-reducer';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { removeItem, sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { CollectionObject } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { InFormEditorContext } from '../FormEditor/Context';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { switchCollection } from '../RouterCommands/SwitchCollection';
import { SearchDialog } from '../SearchDialog';
import type { CollectionRelData } from './collectionRelData';
import {
  fetchOtherCollectionData,
  processColRelationships,
} from './collectionRelData';

export function CollectionOneToManyPlugin({
  resource,
  relationship,
  formatting,
}: {
  readonly resource: SpecifyResource<CollectionObject>;
  readonly relationship: string;
  readonly formatting: string | undefined;
}): JSX.Element | null {
  const isInFormEditor = React.useContext(InFormEditorContext);
  const muteWrongCollectionError = isInFormEditor;
  const [data, setData] = useAsyncState<CollectionRelData | false>(
    React.useCallback(
      async () =>
        fetchOtherCollectionData(
          resource,
          relationship,
          formatting,
          muteWrongCollectionError
        ).catch((error) => {
          softFail(error);
          return false;
        }),
      [resource, relationship, muteWrongCollectionError]
    ),
    false
  );
  useErrorContext('CollectionOneToManyPlugin', data);

  const [state, setState] = React.useState<
    | State<
        'DeniedAccessState',
        {
          readonly collectionName: string;
        }
      >
    | State<'MainState'>
    | State<'SearchState'>
  >({ type: 'MainState' });

  const existingItemFilter =
    data !== undefined && data !== false
      ? data.collectionObjects.map(({ resource }) => resource.id.toString())
      : undefined;

  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  return data === false ? null : (
    <div
      className={`
        w-fit rounded bg-[color:var(--form-background)] p-2
        shadow-sm ring-1 ring-gray-400 dark:ring-0
      `}
    >
      <table className="grid-table grid-cols-[repeat(3,auto)] gap-2">
        <thead>
          <tr>
            <th scope="col">{tables.CollectionObject.label}</th>
            <th scope="col">{tables.Collection.label}</th>
            <td />
          </tr>
        </thead>
        <tbody>
          {typeof data === 'object' ? (
            data.collectionObjects.map(
              (
                { formatted, resource: relatedResource, relationship },
                index
              ) => (
                <tr key={relatedResource.cid}>
                  <td>
                    <Link.Default
                      href={relatedResource.viewUrl()}
                      onClick={(event): void => {
                        event.preventDefault();
                        const availableCollections =
                          userInformation.availableCollections.map(
                            ({ id }) => id
                          );
                        if (
                          availableCollections.includes(data.otherCollection.id)
                        )
                          switchCollection(
                            navigate,
                            data.otherCollection.id,
                            relatedResource.viewUrl()
                          );
                        else
                          setState({
                            type: 'DeniedAccessState',
                            collectionName: data.otherCollection.name,
                          });
                      }}
                    >
                      {formatted}
                    </Link.Default>
                  </td>
                  <td>
                    <Link.Default href={data.otherCollection.href}>
                      {data.otherCollection.formatted}
                    </Link.Default>
                  </td>
                  <td>
                    {hasTablePermission('CollectionRelationship', 'delete') && (
                      <Button.Icon
                        icon="trash"
                        title={commonText.remove()}
                        onClick={(): void => {
                          if (data === undefined) return;
                          resource
                            .getDependentResource(`${data.side}SideRels`)
                            ?.remove(relationship);
                          setData({
                            ...data,
                            collectionObjects: removeItem(
                              data.collectionObjects,
                              index
                            ),
                          });
                        }}
                      />
                    )}
                  </td>
                </tr>
              )
            )
          ) : (
            <tr>
              <td colSpan={2}>{commonText.loading()}</td>
            </tr>
          )}
        </tbody>
      </table>
      {hasTablePermission('CollectionRelationship', 'create') &&
      typeof data === 'object' ? (
        <DataEntry.Add
          aria-pressed={state.type === 'SearchState'}
          onClick={(): void =>
            setState(
              state.type === 'SearchState'
                ? { type: 'MainState' }
                : {
                    type: 'SearchState',
                  }
            )
          }
        />
      ) : undefined}
      {state.type === 'DeniedAccessState' && (
        <Dialog
          buttons={commonText.close()}
          header={userText.collectionAccessDenied()}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          {userText.collectionAccessDeniedDescription({
            collectionName: state.collectionName,
          })}
        </Dialog>
      )}
      {state.type === 'SearchState' && typeof data === 'object' && (
        <SearchDialog
          extraFilters={[
            {
              field: 'id',
              operation: 'in',
              isNot: true,
              value: existingItemFilter?.join(',') ?? '',
            },
          ]}
          forceCollection={data.otherCollection.id}
          multiple
          table={tables.CollectionObject}
          onClose={(): void => setState({ type: 'MainState' })}
          onSelected={(addedResources): void => {
            const addedRelationships = addedResources.map((addedResource) => {
              const toAdd = new tables.CollectionRelationship.Resource();
              toAdd.set(`${data.otherSide}Side`, addedResource);
              toAdd.set(`${data.side}Side`, resource);
              toAdd.set(
                'collectionRelType',
                data.relationshipType.get('resource_uri')
              );
              return toAdd;
            });
            loading(
              resource
                .rgetCollection(`${data.side}SideRels`)
                .then((collection) => collection.add(addedRelationships))
                .then(async () =>
                  processColRelationships(
                    addedRelationships,
                    data.otherSide,
                    formatting
                  )
                )
                .then((relationships) =>
                  setData({
                    ...data,
                    collectionObjects: [
                      ...data.collectionObjects,
                      ...relationships,
                    ].sort(sortFunction(({ formatted }) => formatted)),
                  })
                )
            );
          }}
        />
      )}
    </div>
  );
}
