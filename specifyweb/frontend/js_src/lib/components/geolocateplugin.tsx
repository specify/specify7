import React from 'react';

import type { Geography, Locality } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import localityText from '../localization/locality';
import { schema } from '../schema';
import type { IR } from '../types';
import { filterArray } from '../types';
import { f } from '../functools';
import { Button } from './basic';
import { useAsyncState, useBooleanState } from './hooks';
import { Dialog } from './modaldialog';
import { LoadingContext } from './contexts';
import { hasTablePermission } from '../permissions';
import { formatUrl } from '../querystring';

function GeoLocate({
  resource,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [data] = useAsyncState(
    React.useCallback(
      async () => getGeoLocateData(resource).then((data) => data ?? false),
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

    window.addEventListener('message', listener);
    return (): void => window.removeEventListener('message', listener);
  }, [data, handleClose, resource]);

  return typeof data === 'undefined' ? null : data === false ? (
    <Dialog
      onClose={handleClose}
      title={localityText('geographyRequiredDialogTitle')}
      header={localityText('geographyRequiredDialogHeader')}
      buttons={commonText('close')}
    >
      {localityText('geographyRequiredDialogMessage')}
    </Dialog>
  ) : (
    <Dialog
      header={localityText('geoLocate')}
      modal={false}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      <iframe
        title={localityText('geoLocate')}
        // GEOLocate doesn't like '|' to be uri escaped.
        src={formatUrl(
          'https://www.geo-locate.org/web/webgeoreflight.aspx',
          data
        ).replace(/%7c/gi, '|')}
        // TODO: check these dimensions. Figure out if can make flexible
        style={{ width: '908px', height: '653px' }}
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
    typeof point === 'undefined'
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
    typeof geography === 'undefined'
      ? undefined
      : {
          v: '1',
          w: '900',
          h: '400',
          georef: 'run',
          locality: resource.get('localityName') ?? '',
          tab: 'results',
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
      <Button.Simple
        onClick={handleToggle}
        aria-pressed={isOpen}
        className="w-fit"
      >
        {localityText('geoLocate')}
      </Button.Simple>
      {isOpen && <GeoLocate resource={resource} onClose={handleClose} />}
    </>
  );
}
