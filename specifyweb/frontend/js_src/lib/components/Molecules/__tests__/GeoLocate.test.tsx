import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { GenericGeoLocate } from '../GeoLocate';

requireContext();

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
afterAll(() => portalRoot.remove());

function renderGeoLocate(): { readonly onUpdate: jest.Mock } {
  const onUpdate = jest.fn();
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <GenericGeoLocate
        buttons={<button type="button">{commonText.close()}</button>}
        data={{ locality: 'Lawrence', state: 'Kansas', country: 'USA' }}
        onClose={jest.fn()}
        onUpdate={onUpdate}
      />
    </UnloadProtectsContext.Provider>
  );
  return { onUpdate };
}

test('opens a dialog with locality and geography in the GeoLocate iframe URL', () => {
  renderGeoLocate();
  expect(screen.getByRole('dialog')).toBeVisible();
  const iframe = screen.getByTitle('GEOLocate');
  expect(iframe).toBeVisible();
  const url = new URL(iframe.getAttribute('src')!);
  expect(url.origin).toBe('https://www.geo-locate.org');
  expect(url.pathname).toBe('/web/webgeoreflight.aspx');
  expect(Object.fromEntries(url.searchParams)).toEqual(
    expect.objectContaining({
      locality: 'Lawrence',
      state: 'Kansas',
      country: 'USA',
      georef: 'run',
    })
  );
});

test('passes a GeoLocate coordinate response to the update callback', () => {
  const { onUpdate } = renderGeoLocate();
  act(() => {
    globalThis.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://www.geo-locate.org',
        data: '38.98|-95.14|Unavailable|Unavailable',
      })
    );
  });
  expect(onUpdate).toHaveBeenCalledTimes(1);
  expect(onUpdate).toHaveBeenCalledWith({
    latitude: '38.98',
    longitude: '-95.14',
    uncertainty: 'Unavailable',
    polygon: 'Unavailable',
  });
});

test.each([
  [
    'an unrelated origin',
    'https://example.com',
    '38.98|-95.14|Unavailable|Unavailable',
  ],
  ['an empty response', 'https://www.geo-locate.org', '|||'],
])('ignores messages containing %s', (_, origin, data) => {
  const { onUpdate } = renderGeoLocate();
  act(() => {
    globalThis.dispatchEvent(new MessageEvent('message', { origin, data }));
  });
  expect(onUpdate).not.toHaveBeenCalled();
});
