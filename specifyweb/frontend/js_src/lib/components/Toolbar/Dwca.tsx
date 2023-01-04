/**
 * Do DWCA export
 */

import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formData } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import { AppResourcesAside } from '../AppResources/Aside';
import type { AppResourceFilters } from '../AppResources/filtersHelpers';
import type { AppResources } from '../AppResources/hooks';
import { useAppResources } from '../AppResources/hooks';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { toResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpAppResource } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';
import { headerText } from '../../localization/header';
import { LocalizedString } from 'typesafe-i18n';

export function MakeDwcaOverlay(): JSX.Element | null {
  const [resources] = useAppResources();

  const [definition, setDefinition] = React.useState<string | undefined>(
    undefined
  );

  const loading = React.useContext(LoadingContext);
  const handleClose = React.useContext(OverlayContext);
  const [isExporting, handleExporting] = useBooleanState();

  return resources === undefined ? null : definition === undefined ? (
    <PickAppResource
      header={headerText.chooseDwca()}
      resources={resources}
      onClose={handleClose}
      onSelected={(definition): void => setDefinition(definition?.name)}
    />
  ) : isExporting ? (
    <ExportStarted onClose={handleClose} />
  ) : (
    <>
      <PickAppResource
        header={headerText.chooseMetadataResource()}
        resources={resources}
        skippable
        onClose={(): void => setDefinition(undefined)}
        onSelected={(metadata): void => {
          handleExporting();
          loading(startExport(definition, metadata?.name));
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
  readonly header: LocalizedString;
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
            <Button.DialogClose>{commonText.back()}</Button.DialogClose>
            <Button.Blue onClick={(): void => handleSelected(undefined)}>
              {commonText.skip()}
            </Button.Blue>
          </>
        ) : (
          commonText.back()
        )
      }
      header={header}
      onClose={handleClose}
    >
      <AppResourcesAside
        initialFilters={initialFilters}
        isEmbedded
        isReadOnly
        resources={resources}
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
      buttons={commonText.close()}
      header={headerText.dwcaExportStarted()}
      onClose={handleClose}
    >
      {headerText.dwcaExportStartedDescription()}
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
