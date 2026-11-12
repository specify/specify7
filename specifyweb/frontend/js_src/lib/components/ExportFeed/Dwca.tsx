/**
 * Do DWCA export
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { resourcesText } from '../../localization/resources';
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
import { Input, Label } from '../Atoms/Form';
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
      key="definition"
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
      key="metadata"
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
  appResources: ['dwcaDefinition', 'otherXmlResource', 'otherAppResources'],
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
  const [searchQuery, setSearchQuery] = React.useState('');
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
        <Label.Block className="gap-1">
          <span className="text-sm text-gray-600 dark:text-neutral-400">
            {resourcesText.searchResources()}
          </span>
          <Input.Generic
            autoFocus
            type="search"
            placeholder={commonText.search()}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        </Label.Block>
        <AppResourcesAside
          conformations={conformations}
          filters={filters}
          isEmbedded
          resources={resources}
          searchQuery={searchQuery}
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
