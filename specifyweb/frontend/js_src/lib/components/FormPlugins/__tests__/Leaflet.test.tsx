import React from 'react';

import { localityText } from '../../../localization/locality';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { LoadingContext } from '../../Core/Contexts';
import { tables } from '../../DataModel/tables';
import { LeafletMap } from '../../Leaflet/Map';
import { fetchLocalityDataFromResource } from '../../Leaflet/localityRecordDataExtractor';
import { LeafletPlugin } from '../Leaflet';

jest.mock('../../Leaflet/Map', () => ({
  LeafletMap: jest.fn(() => <div>Map</div>),
}));

jest.mock('../../Leaflet/localityRecordDataExtractor', () => ({
  fetchLocalityDataFromResource: jest.fn(),
}));

requireContext();

const localityData = {
  'locality.latitude1': { headerName: 'Latitude', value: 12.5 },
  'locality.longitude1': { headerName: 'Longitude', value: -45.5 },
};

test('Show Map opens the map with the locality point', async () => {
  jest
    .mocked(fetchLocalityDataFromResource)
    .mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return localityData as never;
    });

  const locality = new tables.Locality.Resource({ id: 1 });
  const { findByText, getByRole, user } = mount(
    <LoadingContext.Provider value={(): void => undefined}>
      <LeafletPlugin locality={locality} id="show-map" />
    </LoadingContext.Provider>
  );

  await user.click(getByRole('button', { name: localityText.showMap() }));

  expect(await findByText('Map')).toBeInTheDocument();
  expect(fetchLocalityDataFromResource).toHaveBeenCalledWith(locality, true);
  expect(jest.mocked(LeafletMap)).toHaveBeenCalledWith(
    expect.objectContaining({ localityPoints: [localityData] }),
    {}
  );
});
