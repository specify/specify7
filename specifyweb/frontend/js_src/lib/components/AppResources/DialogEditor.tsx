import React from 'react';
import { useParams } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import { Button } from '../Atoms/Button';
import { fetchResource, strictIdFromUrl } from '../DataModel/resource';
import { Dialog } from '../Molecules/Dialog';
import { NotFoundView } from '../Router/NotFoundView';
import { OverlayContext } from '../Router/Router';
import { AppResourceEditor } from './Editor';
import { getScope } from './tree';

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
      return {
        resource,
        directory: { ...directory, scope: getScope(directory) },
      };
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
      // FIXME: update list in schema config on this change
      onSaved={handleClose}
    >
      {({ headerString, headerButtons, form, footer }): JSX.Element => (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              {footer}
            </>
          }
          dimensionsKey="appResourceEditor"
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
