import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { getUniqueName } from '../../utils/uniquifyName';
import { Button } from '../Atoms/Button';
import { Form, Input, Label, Select } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { SpQuery, SpQueryFolder } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { isModern } from './helpers';

function parseResourceUri(uri: string | null | undefined): number | null {
  if (uri === null || uri === undefined) return null;
  const id = Number.parseInt(
    uri.split('/').filter(Boolean).pop() ?? '',
    10
  );
  return Number.isNaN(id) ? null : id;
}

async function doSave(
  query: SpecifyResource<SpQuery>,
  name: string,
  isSaveAs: boolean,
  folderId: number | null,
  folders: RA<SerializedResource<SpQueryFolder>>
): Promise<number> {
  query.set('isFavorite', !isModern(query));
  const clonedQuery = isSaveAs ? await query.clone(true) : query;
  clonedQuery.set('name', name.trim());
  if (isSaveAs) clonedQuery.set('specifyUser', userInformation.resource_uri);
  if (folderId !== null) {
    const folder = folders.find((f) => f.id === folderId);
    if (folder !== undefined)
      clonedQuery.set(
        'spQueryFolder',
        `/api/specify/spqueryfolder/${folderId}/`
      );
  }
  return clonedQuery
    .save({
      errorOnAlreadySaving: false,
    })
    .then(() => clonedQuery.id);
}

export function QuerySaveDialog({
  isSaveAs,
  query,
  onClose: handleClose,
  onSaved: handleSaved,
}: {
  readonly isSaveAs: boolean;
  readonly query: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly onSaved: (queryId: number) => void;
}): JSX.Element | null {
  const id = useId('id');
  const [name, setName] = React.useState<string>((): string =>
    isSaveAs
      ? getUniqueName(query.get('name'), [query.get('name')])
      : query.get('name')
  );
  const currentFolderUri = query.get('spQueryFolder') as string | null;
  const currentFolderId = parseResourceUri(currentFolderUri);
  const [folderId, setFolderId] = React.useState<number | null>(
    currentFolderId
  );

  const [folders] = useAsyncState(
    React.useCallback(async () => {
      const result = await fetchCollection('SpQueryFolder', {
        limit: 0,
        domainFilter: false,
        orderBy: 'name',
      });
      const currentUserId = userInformation.id;
      return result.records.filter(
        (f) =>
          (f.scopeType !== null && f.scopeType !== '') ||
          parseResourceUri(
            (f as unknown as Record<string, string>).specifyUser
          ) === currentUserId
      );
    }, []),
    false
  );

  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    if (query.isNew() || isSaveAs) return;
    loading(
      doSave(query, name, isSaveAs, folderId, folders ?? []).then(handleSaved)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return query.isNew() || isSaveAs ? (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Submit.Save form={id('form')}>{commonText.save()}</Submit.Save>
        </>
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      header={isSaveAs ? queryText.saveClonedQuery() : queryText.saveQuery()}
      onClose={handleClose}
    >
      {isSaveAs && <p>{queryText.saveClonedQueryDescription()}</p>}
      <Form
        className="contents"
        id={id('form')}
        onSubmit={(): void =>
          loading(
            doSave(query, name, isSaveAs, folderId, folders ?? []).then(
              handleSaved
            )
          )
        }
      >
        <Label.Block>
          {getField(tables.SpQuery, 'name').label}
          <Input.Text
            autoComplete="on"
            maxLength={getField(tables.SpQuery, 'name').length}
            name="queryName"
            required
            spellCheck="true"
            value={name}
            onValueChange={setName}
          />
        </Label.Block>
        {Array.isArray(folders) && folders.length > 0 && (
          <Label.Block>
            {queryText.folder()}
            <Select
              value={folderId ?? ''}
              onValueChange={(value): void =>
                setFolderId(value === '' ? null : Number(value))
              }
            >
              <option value="">{queryText.all()}</option>
              {folders.map((folder) => (
                <option key={folder.id} value={String(folder.id)}>
                  {folder.scopeType != null && folder.scopeType !== ''
                    ? `\u{1F310} ${folder.name}`
                    : folder.name}
                </option>
              ))}
            </Select>
          </Label.Block>
        )}
      </Form>
    </Dialog>
  ) : null;
}
