import React from 'react';
import { useParams } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import { fetchResource, strictIdFromUrl } from '../DataModel/resource';
import { Dialog } from '../Molecules/Dialog';
import { NotFoundView } from '../Router/NotFoundView';
import { OverlayContext } from '../Router/Router';
import { AppResourceEditor } from './Editor';

/**
 * Edit an app resource in a dialog. Distinct from the full-screen editor
 */
export function DialogEditor(): JSX.Element | null {
  const { id } = useParams();
  const [data] = useAsyncState(
    React.useCallback(async () => {
      const idInt = f.parseInt(id);
      if (idInt === undefined) return false;
      const resource = await fetchResource('SpAppResource', idInt);
      const directory = await fetchResource(
        'SpAppResourceDir',
        strictIdFromUrl(resource.spAppResourceDir)
      );
      return { resource, directory };
    }, [id]),
    true
  );
  const handleClose = React.useContext(OverlayContext);

  return data === undefined ? null : data === false ? (
    <NotFoundView />
  ) : (
    <AppResourceEditor
      directory={data.directory}
      initialData={undefined}
      resource={data.resource}
      onClone={undefined}
      onDeleted={undefined}
      onSaved={handleClose}
    >
      {({ headerString, headerButtons, form, footer }): JSX.Element => (
        <Dialog
          // FIXME: add dimensionsKey once attachments branch is merged
          buttons={footer}
          header={headerString}
          headerButtons={headerButtons}
          onClose={handleClose}
        >
          {form}
        </Dialog>
      )}
    </AppResourceEditor>
  );
}
