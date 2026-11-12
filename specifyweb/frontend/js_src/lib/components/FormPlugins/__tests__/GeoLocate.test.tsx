import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { requireContext } from '../../../tests/helpers';
import { LoadingContext } from '../../Core/Contexts';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { tables } from '../../DataModel/tables';
import type { Geography } from '../../DataModel/types';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { GeoLocatePlugin } from '../GeoLocate';

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasTablePermission: (tableName: string) => tableName === 'Locality',
}));

requireContext();

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
afterAll(() => portalRoot.remove());

test('sends locality geography to GeoLocate and applies returned coordinates', async () => {
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
  const country = makeGeography('USA', 'Country', null);
  const state = makeGeography('Kansas', 'State', country);
  const county = makeGeography('Douglas', 'County', state);
  const locality = new tables.Locality.Resource(
    { localityName: 'Lawrence, KS', latitude1: null, longitude1: null },
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
  const url = new URL(iframe.getAttribute('src')!);
  expect(url.origin).toBe('https://www.geo-locate.org');
  expect(url.pathname).toBe('/web/webgeoreflight.aspx');
  expect(Object.fromEntries(url.searchParams)).toEqual(
    expect.objectContaining({
      georef: 'run',
      locality: 'Lawrence, KS',
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

  expect(setLocalityField).toHaveBeenCalledWith('lat1text', '38.98');
  expect(setLocalityField).toHaveBeenCalledWith('latitude1', 38.98);
  expect(setLocalityField).toHaveBeenCalledWith('long1text', '-95.14');
  expect(setLocalityField).toHaveBeenCalledWith('longitude1', -95.14);
  expect(setLocalityField).toHaveBeenCalledWith('latLongType', 'Point');
  expect(setLocalityField).toHaveBeenCalledWith('latLongMethod', 'GEOLocate');
  await waitFor(() =>
    expect(screen.queryByTitle('GEOLocate')).not.toBeInTheDocument()
  );
});
