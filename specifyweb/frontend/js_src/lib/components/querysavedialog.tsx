import React from 'react';

import commonText from '../localization/common';
import queryText from '../localization/query';
import userInfo from '../userinfo';
import { useId } from './common';
import { LoadingScreen, ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { SpecifyResource } from './wbplanview';

async function doSave(
  query: SpecifyResource,
  name: string,
  isSaveAs: boolean
): Promise<number> {
  const clonedQuery = isSaveAs ? query.clone() : query;
  clonedQuery.set('name', name.trim());

  if (isSaveAs) clonedQuery.set('specifyuser', userInfo.resource_uri);
  return new Promise((resolve) => {
    clonedQuery.save().done(() => resolve(clonedQuery.id as number));
  });
}

function QuerySaveDialog({
  isSaveAs,
  query,
  onClose: handleClose,
}: {
  readonly isSaveAs: boolean;
  readonly query: SpecifyResource;
  readonly onClose: (queryId: number) => void;
}): JSX.Element {
  const id = useId('id');
  const [name, setName] = React.useState<string>(query.get('name'));
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (query.isNew() || isSaveAs) return;
    setIsLoading(true);
    doSave(query, name, isSaveAs).then(handleClose).catch(console.error);
  }, []);

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <ModalDialog
      properties={{
        title: queryText('saveQueryDialogTitle'),
        buttons: [
          {
            text: commonText('save'),
            click(): void {
              /* Submit form */
            },
            type: 'submit',
            form: id('form'),
          },
        ],
      }}
    >
      {isSaveAs
        ? queryText('saveClonedQueryDialogHeader')
        : queryText('saveQueryDialogHeader')}
      <p>
        {isSaveAs
          ? queryText('saveClonedQueryDialogMessage')
          : queryText('saveQueryDialogMessage')}
      </p>
      <form
        id={id('form')}
        onSubmit={(event): void => {
          event.preventDefault();
          setIsLoading(true);
          doSave(query, name, isSaveAs).then(handleClose).catch(console.error);
        }}
      >
        <label>
          {queryText('queryName')}
          <input
            type="text"
            autoComplete="on"
            spellCheck="true"
            required
            value={name}
            onChange={({ target }): void => setName(target.value)}
          />
        </label>
      </form>
    </ModalDialog>
  );
}

const View = createBackboneView({
  moduleName: 'QuerySaveDialog',
  component: QuerySaveDialog,
});

export default View;
