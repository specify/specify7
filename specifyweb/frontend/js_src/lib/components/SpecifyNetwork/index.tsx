/**
 * Display a Specify Network page and handle communication back and force
 * though cross-tab communication (window message passing)
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { f } from '../../utils/functools';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { CollectionObject, Taxon } from '../DataModel/types';
import { LoadingScreen } from '../Molecules/Dialog';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { getUserPref } from '../UserPreferences/helpers';

export const displaySpecifyNetwork = (
  resource: SpecifyResource<AnySchema> | undefined
): resource is SpecifyResource<CollectionObject> | SpecifyResource<Taxon> =>
  getUserPref('form', 'ui', 'specifyNetworkBadge') &&
  hasTablePermission('Locality', 'read') &&
  hasPermission('/querybuilder/query', 'execute') &&
  resource?.isNew() === false &&
  ['Taxon', 'CollectionObject'].includes(resource.specifyModel.name);

export function SpecifyNetworkBadge({
  resource,
}: {
  readonly resource: SpecifyResource<CollectionObject> | SpecifyResource<Taxon>;
}): JSX.Element {
  const [speciesName] = useAsyncState(
    React.useCallback(
      () =>
        f.maybe(toTable(resource, 'Taxon'), async (resource) =>
          resource
            .fetch()
            .then((resource) => resource.get('fullName') ?? undefined)
        ) ??
        f.maybe(
          toTable(resource, 'CollectionObject'),
          (resource) =>
            resource.rgetPromise(
              'currentDetermination.taxon.fullName' as never
            ) as string
        ),
      [resource]
    ),
    false
  );

  const url = formatUrl('/specify/overlay/specify-network/compare/', {
    species: speciesName ?? '',
    guid: toTable(resource, 'CollectionObject')?.get('guid') ?? '',
  });
  const navigate = useNavigate();
  const location = useLocation();
  const Component =
    typeof speciesName === 'string' ? Link.Default : Button.LikeLink;

  // If link was clicked before resource was fully loaded, show loading message
  const [isPending, handlePending, handleNotPending] = useBooleanState();
  React.useEffect(() => {
    if (isPending && typeof speciesName === 'string') {
      handleNotPending();
      navigate(url, {
        // FIXME: this won't be needed once agent merging is merged
        state: {
          type: 'BackgroundLocation',
          location,
        },
      });
    }
  }, [isPending, location, handleNotPending, navigate, url, speciesName]);

  return (
    <>
      {isPending && <LoadingScreen />}
      <Component
        aria-label={specifyNetworkText.specifyNetwork()}
        href={url}
        title={specifyNetworkText.specifyNetwork()}
        onClick={(event): void => {
          if (typeof speciesName === 'string') return;
          event.preventDefault();
          handlePending();
        }}
      >
        <img
          alt=""
          className="h-7"
          src="/static/img/specify_network_logo_long.svg"
        />
      </Component>
    </>
  );
}
