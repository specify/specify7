import React from 'react';

import type { SpQuery } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import queryText from '../localization/query';
import userInfo from '../userinfo';
import { Button, Form, Input, Label, Submit } from './basic';
import { useId } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';

async function doSave(
  query: SpecifyResource<SpQuery>,
  name: string,
  isSaveAs: boolean
): Promise<number> {
  const clonedQuery = isSaveAs ? query.clone() : query;
  clonedQuery.set('name', name.trim());

  if (isSaveAs) clonedQuery.set('specifyUser', userInfo.resource_uri);
  return new Promise((resolve) => {
    clonedQuery.save().then(() => resolve(clonedQuery.id));
  });
}

function QuerySaveDialog({
  isSaveAs,
  query,
  onClose: handleClose,
  onSave: handleSave,
}: {
  readonly isSaveAs: boolean;
  readonly query: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly onSave: (queryId: number) => void;
}): JSX.Element {
  const id = useId('id');
  const [name, setName] = React.useState<string>(query.get('name'));
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (query.isNew() || isSaveAs) return;
    setIsLoading(true);
    doSave(query, name, isSaveAs).then(handleClose).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <Dialog
      title={queryText('saveQueryDialogTitle')}
      header={
        isSaveAs
          ? queryText('saveClonedQueryDialogHeader')
          : queryText('saveQueryDialogHeader')
      }
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          <Submit.Blue form={id('form')} value={commonText('save')} />
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
          setIsLoading(true);
          doSave(query, name, isSaveAs).then(handleSave).catch(console.error);
        }}
      >
        <Label>
          {queryText('queryName')}
          <Input
            type="text"
            autoComplete="on"
            spellCheck="true"
            required
            value={name}
            onChange={({ target }): void => setName(target.value)}
          />
        </Label>
      </Form>
    </Dialog>
  );
}

const View = createBackboneView(QuerySaveDialog);

export default View;
