import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { f } from '../../utils/functools';
import type { IR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { Geography, Locality } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import type { GeoLocatePayload } from '../Molecules/GeoLocate';
import { GenericGeoLocate } from '../Molecules/GeoLocate';
import { hasTablePermission } from '../Permissions/helpers';

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
        {localityText.geoLocate()}
      </Button.Small>
      {isOpen && <GeoLocate resource={resource} onClose={handleClose} />}
    </>
  );
}

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
      async () => getGeoLocateData(resource).then((data) => data ?? false),
      [resource]
    ),
    true
  );
  const loading = React.useContext(LoadingContext);

  const [clicked, handleClicked] = useBooleanState();
  const handleUpdate = React.useCallback(
    ({ latitude, longitude, uncertainty, polygon }: GeoLocatePayload) => {
      handleClicked();

      resource.set('lat1text', latitude);
      resource.set('latitude1', Number.parseFloat(latitude));
      resource.set('long1text', longitude);
      resource.set('longitude1', Number.parseFloat(longitude));
      resource.set('latLongType', 'Point');
      // Presumably available in picklist.
      resource.set('latLongMethod', 'GEOLocate');

      const uncertaintyParsed =
        uncertainty === 'Unavailable'
          ? undefined
          : Number.parseFloat(uncertainty);
      const polyParsed = polygon === 'Unavailable' ? undefined : polygon;

      const savePolygon =
        (typeof uncertaintyParsed === 'number' ||
          typeof polygon === 'string') &&
        hasTablePermission('GeoCoordDetail', 'read') &&
        hasTablePermission('GeoCoordDetail', 'create') &&
        hasTablePermission('GeoCoordDetail', 'update');
      if (savePolygon)
        loading(
          resource
            .rgetPromise('geoCoordDetails')
            .then((details) => {
              let detailsResource = details;
              if (detailsResource === null) {
                detailsResource = new tables.GeoCoordDetail.Resource();
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
            .then(handleClose)
        );
      else handleClose();
    },
    [loading, resource, handleClicked]
  );

  return data === undefined ? null : data === false ? (
    <Dialog
      buttons={commonText.close()}
      header={localityText.geographyRequired({
        geographyTable: tables.Geography.label,
      })}
      onClose={handleClose}
    >
      {localityText.geographyRequiredDescription()}
    </Dialog>
  ) : (
    <GenericGeoLocate
      buttons={
        <Button.DialogClose
          component={clicked ? Button.Info : Button.Secondary}
        >
          {commonText.close()}
        </Button.DialogClose>
      }
      data={data}
      onClose={handleClose}
      onUpdate={
        hasTablePermission('Locality', resource.isNew() ? 'create' : 'update')
          ? handleUpdate
          : undefined
      }
    />
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
    .then(async (geography) =>
      geography === null ? undefined : constructGeography(geography)
    );

  return f.all({ geography, uncertainty }).then(({ geography, uncertainty }) =>
    geography === undefined
      ? undefined
      : {
          locality: resource.get('localityName') ?? '',
          ...geography,
          ...(Array.isArray(point)
            ? {
                points: filterArray([...point, uncertainty])
                  .map((part) => part.toString().replaceAll(/[:|]/gu, ' '))
                  .join('|'),
              }
            : {}),
        }
  );
}
