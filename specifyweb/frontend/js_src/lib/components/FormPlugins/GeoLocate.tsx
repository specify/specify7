import React from 'react';

import type { Geography, Locality } from '../DataModel/types';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { hasTablePermission } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { schema } from '../DataModel/schema';
import type { IR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { useCachedState } from '../../hooks/useCachedState';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';

const defaultWidth = 947;
const defaultHeight = 779;

// REFACTOR: merge this with GeoLocate code in the WB once WB is using react
function GeoLocate({
  resource,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [data] = useAsyncState(
    React.useCallback(
      async () => getGeoLocateData(resource).then((data = false) => data),
      [resource]
    ),
    true
  );
  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    if (typeof data !== 'object') return undefined;

    function listener(event: MessageEvent): void {
      if (
        !event.origin.endsWith('www.geo-locate.org') ||
        typeof event.data !== 'string' ||
        !hasTablePermission('Locality', resource.isNew() ? 'create' : 'update')
      )
        return;

      const [lat, long, uncertainty, poly] = event.data.split('|');

      resource.set('lat1text', lat);
      resource.set('latitude1', Number.parseFloat(lat));
      resource.set('long1text', long);
      resource.set('longitude1', Number.parseFloat(long));
      resource.set('latLongType', 'Point');
      // Presumably available in picklist.
      resource.set('latLongMethod', 'GEOLocate');

      const uncertaintyParsed =
        uncertainty === 'Unavailable'
          ? undefined
          : Number.parseFloat(uncertainty);
      const polyParsed = poly === 'Unavailable' ? undefined : poly;

      loading(
        ((typeof uncertaintyParsed === 'number' || typeof poly === 'string') &&
        hasTablePermission('GeoCoordDetail', 'read') &&
        hasTablePermission('GeoCoordDetail', 'create') &&
        hasTablePermission('GeoCoordDetail', 'update')
          ? resource.rgetPromise('geoCoordDetails').then((details) => {
              let detailsResource = details;
              if (detailsResource === null) {
                detailsResource = new schema.models.GeoCoordDetail.Resource();
                detailsResource.placeInSameHierarchy(resource);
                resource.set('geoCoordDetails', detailsResource);
              }
              detailsResource.set(
                'maxUncertaintyEst',
                uncertaintyParsed ?? null
              );
              detailsResource.set(
                'maxUncertaintyEstUnit',
                typeof uncertaintyParsed === 'number' ? 'm' : ''
              );
              detailsResource.set('errorPolygon', polyParsed ?? null);
            })
          : Promise.resolve()
        ).then(handleClose)
      );
    }

    globalThis.window.addEventListener('message', listener);
    return (): void => globalThis.removeEventListener('message', listener);
  }, [loading, data, handleClose, resource]);

  const [width = defaultWidth, setWidth] = useCachedState('geoLocate', 'width');
  const [height = defaultHeight, setHeight] = useCachedState(
    'geoLocate',
    'height'
  );

  return data === undefined ? null : data === false ? (
    <Dialog
      buttons={commonText('close')}
      header={localityText('geographyRequiredDialogHeader')}
      onClose={handleClose}
    >
      {localityText('geographyRequiredDialogText')}
    </Dialog>
  ) : (
    <Dialog
      buttons={commonText('close')}
      forwardRef={{
        container(container): void {
          if (container === null) return;
          container.style.width = `${width}px`;
          container.style.height = `${height}px`;
        },
      }}
      header={localityText('geoLocate')}
      modal={false}
      onClose={handleClose}
      // REFACTOR: consider adding a hook to remember dialog size and position
      onResize={(container): void => {
        setWidth(container.clientWidth);
        setHeight(container.clientHeight);
      }}
    >
      <iframe
        className="h-full"
        // GEOLocate doesn't like '|' to be uri escaped.
        src={formatUrl(
          'https://www.geo-locate.org/web/webgeoreflight.aspx',
          data
        ).replace(/%7c/gi, '|')}
        title={localityText('geoLocate')}
      />
    </Dialog>
  );
}

async function getGeoLocateData(
  resource: SpecifyResource<Locality>
): Promise<IR<string> | undefined> {
  const currentLat = resource.get('latitude1');
  const currentLon = resource.get('longitude1');
  const name = resource.get('localityName') ?? '';

  const point =
    currentLat !== null && currentLon !== null
      ? [currentLat, currentLon, name, '']
      : undefined;

  const constructGeography = async (
    geography: SpecifyResource<Geography>
  ): Promise<IR<string>> =>
    f
      .all({
        parent: geography.rgetPromise('parent'),
        geographyDefinition: geography.rgetPromise('definitionItem', true),
      })
      .then(async ({ parent, geographyDefinition }) => {
        const level = geographyDefinition.get('name').toLowerCase();
        return {
          ...(['country', 'state', 'county'].includes(level)
            ? { [level]: geography.get('name') }
            : {}),
          ...(parent === null ? {} : await constructGeography(parent)),
        };
      });

  const uncertainty =
    point === undefined
      ? undefined
      : resource
          .rgetPromise('geoCoordDetails')
          .then((details) => details?.get('maxUncertaintyEst') ?? '');

  const geography = resource
    .rgetPromise('geography')
    .then((geography) =>
      geography === null ? undefined : constructGeography(geography)
    );

  return f.all({ geography, uncertainty }).then(({ geography, uncertainty }) =>
    geography === undefined
      ? undefined
      : {
          v: '1',
          w: '900',
          h: '400',
          georef: 'run',
          locality: resource.get('localityName') ?? '',
          ...geography,
          ...(Array.isArray(point)
            ? {
                points: filterArray([...point, uncertainty])
                  .map((part) => part.toString().replace(/[:|]/g, ' '))
                  .join('|'),
              }
            : {}),
        }
  );
}

export function GeoLocatePlugin({
  resource,
}: {
  readonly resource: SpecifyResource<Locality>;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  return (
    <>
      <Button.Small
        aria-pressed={isOpen}
        className="w-fit"
        onClick={handleToggle}
      >
        {localityText('geoLocate')}
      </Button.Small>
      {isOpen && <GeoLocate resource={resource} onClose={handleClose} />}
    </>
  );
}
