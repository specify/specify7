import React from 'react';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { getUniqueName } from '../../utils/uniquifyName';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpQuery } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';

async function doSave(
  query: SpecifyResource<SpQuery>,
  name: string,
  isSaveAs: boolean
): Promise<number> {
  const clonedQuery = isSaveAs ? await query.clone(true) : query;
  clonedQuery.set('name', name.trim());

  if (isSaveAs) clonedQuery.set('specifyUser', userInformation.resource_uri);
  return clonedQuery
    .save({
      // This may happen in development because React renders each component twice
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

  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    if (query.isNew() || isSaveAs) return;
    loading(doSave(query, name, isSaveAs).then(handleSaved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return query.isNew() || isSaveAs ? (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText.save()}</Submit.Blue>
        </>
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      header={
        isSaveAs
          ? queryText.saveClonedQueryDialogHeader()
          : queryText.saveQuery()
      }
      onClose={handleClose}
    >
      <p>
        {isSaveAs
          ? queryText.saveClonedQueryDialogText()
          : queryText.saveQueryDialogText()}
      </p>
      <Form
        className="contents"
        id={id('form')}
        onSubmit={(): void =>
          loading(doSave(query, name, isSaveAs).then(handleSaved))
        }
      >
        <Label.Block>
          {queryText.queryName()}
          <Input.Text
            autoComplete="on"
            maxLength={
              schema.models.SpQuery.strictGetLiteralField('name').length
            }
            name="queryName"
            required
            spellCheck="true"
            value={name}
            onValueChange={setName}
          />
        </Label.Block>
      </Form>
    </Dialog>
  ) : null;
}
