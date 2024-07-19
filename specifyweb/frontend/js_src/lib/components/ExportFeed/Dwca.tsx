/**
 * Do DWCA export
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { formData } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import type { AppResourcesConformation } from '../AppResources/Aside';
import { AppResourcesAside } from '../AppResources/Aside';
import type { AppResourceFilters } from '../AppResources/filtersHelpers';
import type { AppResources } from '../AppResources/hooks';
import { useAppResources } from '../AppResources/hooks';
import { Button } from '../Atoms/Button';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { toResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpAppResource } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { OverlayContext } from '../Router/Router';

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
      filters={dwcaAppResourceFilter}
      header={headerText.chooseDwca()}
      resources={resources}
      onClose={handleClose}
      onSelected={(definition): void => setDefinition(definition?.name)}
    />
  ) : isExporting ? (
    <ExportStarted onClose={handleClose} />
  ) : (
    <PickAppResource
      filters={dwcaAppResourceFilter}
      header={headerText.chooseMetadataResource()}
      resources={resources}
      skippable
      onClose={(): void => setDefinition(undefined)}
      onSelected={(metadata): void => {
        handleExporting();
        loading(startExport(definition, metadata?.name));
      }}
    />
  );
}

export const dwcaAppResourceFilter: AppResourceFilters = {
  viewSets: false,
  appResources: ['otherXmlResource', 'otherAppResources'],
};

export function PickAppResource({
  resources,
  header,
  skippable = false,
  filters,
  onClose: handleClose,
  onSelected: handleSelected,
}: {
  readonly resources: AppResources;
  readonly header: LocalizedString;
  readonly skippable?: boolean;
  readonly filters: AppResourceFilters;
  readonly onSelected: (
    appResource: SerializedResource<SpAppResource> | undefined
  ) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const conformations = React.useState<
    RA<AppResourcesConformation> | undefined
  >(undefined);
  return (
    <Dialog
      buttons={
        skippable ? (
          <>
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            <Button.Info onClick={(): void => handleSelected(undefined)}>
              {commonText.skip()}
            </Button.Info>
          </>
        ) : (
          commonText.close()
        )
      }
      header={header}
      onClose={handleClose}
    >
      <ReadOnlyContext.Provider value>
        <AppResourcesAside
          conformations={conformations}
          filters={filters}
          isEmbedded
          resources={resources}
          onOpen={(selected): void => {
            f.maybe(toResource(selected, 'SpAppResource'), handleSelected);
          }}
        />
      </ReadOnlyContext.Provider>
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
    errorMode: 'dismissible',
  }).then(f.void);
