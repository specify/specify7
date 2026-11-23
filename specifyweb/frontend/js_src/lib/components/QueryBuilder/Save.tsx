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
import { getField } from '../DataModel/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { SpQuery } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { isModern } from './helpers';
import {
  fetchVisibleQueryFolders,
  isSharedFolder,
  parseResourceId,
} from './queryFolders';

async function doSave(
  query: SpecifyResource<SpQuery>,
  name: string,
  isSaveAs: boolean,
  folderId: number | null
): Promise<number> {
  query.set('isFavorite', !isModern(query));
  const clonedQuery = isSaveAs ? await query.clone(true) : query;
  clonedQuery.set('name', name.trim());
  if (isSaveAs) clonedQuery.set('specifyUser', userInformation.resource_uri);
  clonedQuery.set(
    'spQueryFolder',
    folderId === null ? null : `/api/specify/spqueryfolder/${folderId}/`
  );
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
  const [folderId, setFolderId] = React.useState<number | null>(
    parseResourceId(query.get('spQueryFolder') as string | null)
  );

  const [folders] = useAsyncState(
    React.useCallback(async () => fetchVisibleQueryFolders(), []),
    false
  );

  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    if (query.isNew() || isSaveAs) return;
    loading(doSave(query, name, isSaveAs, folderId).then(handleSaved));
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
          loading(doSave(query, name, isSaveAs, folderId).then(handleSaved))
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
                  {isSharedFolder(folder)
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
