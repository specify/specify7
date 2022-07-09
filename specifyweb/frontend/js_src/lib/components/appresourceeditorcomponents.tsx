import React from 'react';

import { getAppResourceType } from '../appresourcesfilters';
import type {
  SpAppResource,
  SpViewSetObj as SpViewSetObject,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { parseResourceUrl } from '../resource';
import { appResourceSubTypes, appResourceTypes } from './appresourcescreate';
import { getAppResourceExtension } from './appresourceshooks';
import { Button } from './basic';
import { LoadingContext } from './contexts';
import { downloadFile, FilePicker, fileToText } from './filepicker';
import { useBooleanState } from './hooks';
import { Dialog } from './modaldialog';

export function AppResourceIcon({
  resource,
}: {
  readonly resource: SerializedResource<SpViewSetObject | SpAppResource>;
}): JSX.Element {
  const tableName = parseResourceUrl(resource.resource_uri ?? '')?.[0];
  if (tableName === 'SpViewSetObj') return appResourceTypes.viewSets.icon;
  const type = getAppResourceType(
    resource as SerializedResource<SpAppResource>
  );
  return appResourceSubTypes[type].icon;
}

export function AppResourceLoad({
  onLoaded: handleLoaded,
}: {
  readonly onLoaded: (data: string, mimeType: string) => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);
  return (
    <>
      <Button.Green className="whitespace-nowrap" onClick={handleOpen}>
        {adminText('loadFile')}
      </Button.Green>
      {isOpen && (
        <Dialog
          header={adminText('loadFile')}
          onClose={handleClose}
          buttons={commonText('cancel')}
        >
          <FilePicker
            onSelected={(file): void =>
              loading(
                fileToText(file)
                  .then((data) => handleLoaded(data, file.type))
                  .finally(handleClose)
              )
            }
            acceptedFormats={undefined}
          />
        </Dialog>
      )}
    </>
  );
}

export function AppResourceDownload({
  resource,
  data,
}: {
  readonly resource: SerializedResource<SpViewSetObject | SpAppResource>;
  readonly data: string;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  return (
    <Button.Green
      className="whitespace-nowrap"
      disabled={data.length === 0}
      onClick={(): void =>
        loading(
          downloadFile(
            `${resource.name}.${getAppResourceExtension(resource)}`,
            data
          )
        )
      }
    >
      {commonText('download')}
    </Button.Green>
  );
}
