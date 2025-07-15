/**
 * Display a Specify Network page and handle communication back and force
 * though cross-tab communication (window message passing)
 */

import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { toggleItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { CollectionObject, Taxon } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { SpecifyNetworkOverlays } from './Overlay';

export const displaySpecifyNetwork = (
  resource: SpecifyResource<AnySchema> | undefined
): resource is SpecifyResource<CollectionObject> | SpecifyResource<Taxon> =>
  userPreferences.get('form', 'ui', 'specifyNetworkBadge') &&
  hasTablePermission('Locality', 'read') &&
  resource?.isNew() === false &&
  ['Taxon', 'CollectionObject'].includes(resource.specifyTable.name);

export type SpecifyNetworkBadge = 'CollectionObject' | 'Locality' | 'Taxon';

export function SpecifyNetworkBadge({
  resource,
}: {
  readonly resource: SpecifyResource<CollectionObject> | SpecifyResource<Taxon>;
}): JSX.Element {
  const [taxon] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.resolve(
          f.maybe(toTable(resource, 'Taxon'), async (resource) =>
            resource.fetch()
          ) ??
            f.maybe(toTable(resource, 'CollectionObject'), (resource) =>
              resource.rgetPromise('currentDetermination.taxon' as never)
            ) ??
            undefined
        ).then((taxon) => taxon ?? false),
      [resource]
    ),
    false
  );
  const speciesName = React.useMemo(
    () => (taxon === false ? undefined : taxon?.get('fullName')) ?? undefined,
    [taxon]
  );
  const isNoSpecies =
    taxon === false || (typeof taxon === 'object' && taxon.id === undefined);
  const guid = toTable(resource, 'CollectionObject')?.get('guid') ?? '';
  const isDisabled = speciesName === '' && guid === '';
  const getSetOpen = React.useState<RA<SpecifyNetworkBadge>>([]);
  const [open, setOpen] = getSetOpen;
  /*
   * Note, this is not reset if resource changes as if they used the badge for
   * one resource, likely would also use it for the next resource
   */
  const [startFetching, handleStartFetching] = useBooleanState();
  const handleToggle = (name: SpecifyNetworkBadge) => (): void => {
    setOpen(toggleItem(open, name));
    handleStartFetching();
  };

  return open.length > 0 && isDisabled ? (
    <Dialog
      buttons={commonText.close()}
      header={specifyNetworkText.specifyNetwork()}
      onClose={(): void => setOpen([])}
    >
      {specifyNetworkText.occurrenceOrGuidRequired()}
    </Dialog>
  ) : (
    <div
      className="border-brand-300 flex rounded-full border-2"
      title={specifyNetworkText.specifyNetwork()}
      /*
       * Start loading data as soon as hovered over the badge, even before
       * click, thus providing better UX
       */
      onMouseOver={handleStartFetching}
    >
      <div className="relative flex w-8 items-center justify-center rounded-full">
        <img
          alt={specifyNetworkText.specifyNetwork()}
          className="absolute -left-2 h-9 w-9 max-w-[unset]"
          src="/static/img/specify_network_logo.svg"
        />
      </div>
      <div className="flex gap-2 p-1 pr-2">
        {guid !== '' && (
          <Button.LikeLink
            onClick={handleToggle('CollectionObject')}
            onFocus={handleStartFetching}
          >
            <TableIcon label name="CollectionObject" />
          </Button.LikeLink>
        )}
        {!isNoSpecies && (
          <Button.LikeLink
            onClick={handleToggle('Taxon')}
            onFocus={handleStartFetching}
          >
            <TableIcon label name="Taxon" />
          </Button.LikeLink>
        )}
        <Button.LikeLink
          onClick={handleToggle('Locality')}
          onFocus={handleStartFetching}
        >
          <TableIcon label name="Locality" />
        </Button.LikeLink>
      </div>
      {startFetching && (
        <SpecifyNetworkOverlays
          guid={guid}
          open={getSetOpen}
          species={localized(speciesName ?? '')}
          taxonId={isNoSpecies ? false : taxon?.id}
        />
      )}
    </div>
  );
}
