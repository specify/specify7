import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { localityText } from '../../../localization/locality';
import { requireContext } from '../../../tests/helpers';
import { LoadingContext } from '../../Core/Contexts';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { tables } from '../../DataModel/tables';
import type { Geography } from '../../DataModel/types';
import { hasTablePermission } from '../../Permissions/helpers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { GeoLocatePlugin } from '../GeoLocate';

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasTablePermission: jest.fn(),
}));

requireContext();

beforeEach(() => {
  jest
    .mocked(hasTablePermission)
    .mockImplementation((tableName) => tableName === 'Locality');
});

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
afterAll(() => portalRoot.remove());

function makeGeography(
  name: string,
  rank: string,
  parent: SpecifyResource<Geography> | null
): SpecifyResource<Geography> {
  const geography = new tables.Geography.Resource(
    { name },
    { noBusinessRules: true }
  );
  geography.set(
    'definitionItem',
    new tables.GeographyTreeDefItem.Resource(
      { name: rank },
      { noBusinessRules: true }
    )
  );
  if (parent !== null) geography.set('parent', parent);
  return geography;
}

test('sends locality geography to GeoLocate and applies returned coordinates', async () => {
  const country = makeGeography('USA', 'Country', null);
  const state = makeGeography('Kansas', 'State', country);
  const county = makeGeography('Douglas', 'County', state);
  const locality = new tables.Locality.Resource(
    { localityName: 'Lawrence', latitude1: null, longitude1: null },
    { noBusinessRules: true }
  );
  locality.set('geography', county);
  const setLocalityField = jest.spyOn(locality, 'set');
  const user = userEvent.setup();

  render(
    <UnloadProtectsContext.Provider value={[]}>
      <LoadingContext.Provider value={(promise) => void promise}>
        <GeoLocatePlugin resource={locality} />
      </LoadingContext.Provider>
    </UnloadProtectsContext.Provider>
  );

  await act(async () => {
    await user.click(screen.getByRole('button', { name: 'GEOLocate' }));
  });
  const iframe = await screen.findByTitle('GEOLocate');
  expect(screen.getByRole('dialog')).toBeVisible();
  const url = new URL(iframe.getAttribute('src')!);
  expect(url.origin).toBe('https://www.geo-locate.org');
  expect(url.pathname).toBe('/web/webgeoreflight.aspx');
  expect(Object.fromEntries(url.searchParams)).toEqual(
    expect.objectContaining({
      georef: 'run',
      locality: 'Lawrence',
      county: 'Douglas',
      state: 'Kansas',
      country: 'USA',
    })
  );
  expect(url.searchParams.has('points')).toBe(false);
  expect(setLocalityField).not.toHaveBeenCalled();

  act(() => {
    globalThis.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://www.geo-locate.org',
        data: '38.98|-95.14|Unavailable|Unavailable',
      })
    );
  });

  expect({
    latitude: locality.get('latitude1'),
    longitude: locality.get('longitude1'),
    latitudeText: locality.get('lat1text'),
    longitudeText: locality.get('long1text'),
    type: locality.get('latLongType'),
    method: locality.get('latLongMethod'),
  }).toEqual({
    latitude: 38.98,
    longitude: -95.14,
    latitudeText: '38.98',
    longitudeText: '-95.14',
    type: 'Point',
    method: 'GEOLocate',
  });
  await waitFor(() =>
    expect(screen.queryByTitle('GEOLocate')).not.toBeInTheDocument()
  );
});

test('shows the geography-required dialog when locality has no geography', async () => {
  const locality = new tables.Locality.Resource(
    { localityName: 'Lawrence', latitude1: null, longitude1: null },
    { noBusinessRules: true }
  );
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <LoadingContext.Provider value={(promise) => void promise}>
        <GeoLocatePlugin resource={locality} />
      </LoadingContext.Provider>
    </UnloadProtectsContext.Provider>
  );
  const user = userEvent.setup();
  await act(async () => {
    await user.click(screen.getByRole('button', { name: 'GEOLocate' }));
  });
  await expect(
    screen.findByRole('dialog', {
      name: localityText.geographyRequired({
        geographyTable: tables.Geography.label,
      }),
    })
  ).resolves.toBeVisible();
  expect(screen.queryByTitle('GEOLocate')).not.toBeInTheDocument();
  expect(locality.get('latitude1')).toBeNull();
  expect(locality.get('longitude1')).toBeNull();
});

test.each([false, true])(
  'applies marker coordinates and uncertainty with existing details: %s',
  async (hasDetails) => {
    jest.mocked(hasTablePermission).mockReturnValue(true);
    const locality = new tables.Locality.Resource(
      { localityName: 'Lawrence', latitude1: null, longitude1: null },
      { noBusinessRules: true }
    );
    locality.set('geography', makeGeography('USA', 'Country', null));
    const originalDetails = hasDetails
      ? new tables.GeoCoordDetail.Resource(
          { maxUncertaintyEst: 100, maxUncertaintyEstUnit: 'm' },
          { noBusinessRules: true }
        )
      : undefined;
    if (originalDetails !== undefined)
      locality.set('geoCoordDetails', originalDetails);
    render(
      <UnloadProtectsContext.Provider value={[]}>
        <LoadingContext.Provider value={(promise) => void promise}>
          <GeoLocatePlugin resource={locality} />
        </LoadingContext.Provider>
      </UnloadProtectsContext.Provider>
    );
    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'GEOLocate' }));
    });
    await screen.findByTitle('GEOLocate');
    act(() => {
      globalThis.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://www.geo-locate.org',
          data: '38.111225|-96.00869|7061|Unavailable',
        })
      );
    });
    await waitFor(() =>
      expect(screen.queryByTitle('GEOLocate')).not.toBeInTheDocument()
    );
    const details = await locality.rgetPromise('geoCoordDetails');
    expect(details).not.toBeNull();
    expect({
      latitude: locality.get('latitude1'),
      longitude: locality.get('longitude1'),
      type: locality.get('latLongType'),
      method: locality.get('latLongMethod'),
      uncertainty: details?.get('maxUncertaintyEst'),
      unit: details?.get('maxUncertaintyEstUnit'),
      polygon: details?.get('errorPolygon') ?? null,
    }).toEqual({
      latitude: 38.111_225,
      longitude: -96.008_69,
      type: 'Point',
      method: 'GEOLocate',
      uncertainty: 7061,
      unit: 'm',
      polygon: null,
    });
  }
);
