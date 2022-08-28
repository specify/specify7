/**
 * Do DWCA export
 */

import React from 'react';

import { ping } from '../../utils/ajax/ping';
import { formData } from '../../utils/ajax/helpers';
import type { AppResourceFilters } from '../AppResources/filtersHelpers';
import type { SpAppResource } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import { commonText } from '../../localization/common';
import { toResource } from '../DataModel/specifyModel';
import { AppResourcesAside } from '../AppResources/Aside';
import type { AppResources } from '../AppResources/hooks';
import { useAppResources } from '../AppResources/hooks';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { useBooleanState } from '../../hooks/useBooleanState';

export function MakeDwcaOverlay(): JSX.Element | null {
  const [resources] = useAppResources();

  const [definition, setDefinition] = React.useState<string | undefined>(
    undefined
  );

  const loading = React.useContext(LoadingContext);
  const handleClose = React.useContext(OverlayContext);
  const [isExporting, handleExporting, handleExported] = useBooleanState();

  return resources === undefined ? null : definition === undefined ? (
    <PickAppResource
      header={commonText('chooseDwcaDialogTitle')}
      resources={resources}
      onClose={handleClose}
      onSelected={(definition): void => setDefinition(definition?.name)}
    />
  ) : isExporting ? (
    <ExportStarted onClose={handleClose} />
  ) : (
    <>
      <PickAppResource
        header={commonText('chooseMetadataResource')}
        resources={resources}
        skippable
        onClose={(): void => setDefinition(undefined)}
        onSelected={(metadata): void => {
          handleExporting();
          loading(startExport(definition, metadata?.name).then(handleExported));
        }}
      />
      ;
    </>
  );
}

const initialFilters: AppResourceFilters = {
  viewSets: false,
  appResources: ['otherXmlResource', 'otherAppResources'],
};

function PickAppResource({
  resources,
  header,
  skippable = false,
  onClose: handleClose,
  onSelected: handleSelected,
}: {
  readonly resources: AppResources;
  readonly header: string;
  readonly skippable?: boolean;
  readonly onSelected: (
    appResource: SerializedResource<SpAppResource> | undefined
  ) => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        skippable ? (
          <>
            <Button.DialogClose>{commonText('back')}</Button.DialogClose>
            <Button.Blue onClick={(): void => handleSelected(undefined)}>
              {commonText('skip')}
            </Button.Blue>
          </>
        ) : (
          commonText('back')
        )
      }
      header={header}
      onClose={handleClose}
    >
      <AppResourcesAside
        initialFilters={initialFilters}
        resources={resources}
        isReadOnly
        onOpen={(selected): void =>
          f.maybe(toResource(selected, 'SpAppResource'), handleSelected)
        }
      />
    </Dialog>
  );
}

function ExportStarted({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={commonText('close')}
      header={commonText('dwcaExportStartedDialogHeader')}
      onClose={handleClose}
    >
      {commonText('dwcaExportStartedDialogText')}
    </Dialog>
  );
}

const startExport = async (
  definition: string,
  metadata: string | undefined
): Promise<void> =>
  ping('/export/make_dwca/', {
    method: 'POST',
    body: formData({
      definition,
      ...(typeof metadata === 'string' ? { metadata } : {}),
    }),
  }).then(f.void);
