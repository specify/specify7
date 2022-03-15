import React from 'react';

import type { SpQuery } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import { userInformation } from '../userinfo';
import { Button, Form, Input, Label, Submit } from './basic';
import { crash } from './errorboundary';
import { useBooleanState, useId } from './hooks';
import { Dialog, dialogClassNames, LoadingScreen } from './modaldialog';

async function doSave(
  query: SpecifyResource<SpQuery>,
  name: string,
  isSaveAs: boolean
): Promise<number> {
  const clonedQuery = isSaveAs ? query.clone() : query;
  clonedQuery.set('name', name.trim());

  if (isSaveAs) clonedQuery.set('specifyUser', userInformation.resource_uri);
  return Promise.resolve(clonedQuery.save()).then(() => clonedQuery.id);
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
}): JSX.Element {
  const id = useId('id');
  const [name, setName] = React.useState<string>(query.get('name'));
  const [isLoading, handleLoading, handleLoaded] = useBooleanState();

  React.useEffect(() => {
    if (query.isNew() || isSaveAs) return;
    handleLoaded();
    doSave(query, name, isSaveAs).then(handleClose).catch(crash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLoaded]);

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <Dialog
      header={
        isSaveAs
          ? queryText('saveClonedQueryDialogHeader')
          : queryText('saveQueryDialogHeader')
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('save')}</Submit.Blue>
        </>
      }
    >
      <p>
        {isSaveAs
          ? queryText('saveClonedQueryDialogMessage')
          : queryText('saveQueryDialogMessage')}
      </p>
      <Form
        className="contents"
        id={id('form')}
        onSubmit={(event): void => {
          event.preventDefault();
          handleLoading();
          doSave(query, name, isSaveAs).then(handleSaved).catch(crash);
        }}
      >
        <Label.Generic>
          {queryText('queryName')}
          <Input.Text
            name="queryName"
            autoComplete="on"
            spellCheck="true"
            required
            value={name}
            onValueChange={setName}
          />
        </Label.Generic>
      </Form>
    </Dialog>
  );
}
