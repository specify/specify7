import { buildGeoLocateData } from '../GeoLocate';

test('keeps geography and locality when coordinates are blank', () => {
  const headers = ['Country', 'State', 'County', 'Locality', 'Lat', 'Lon'];
  const localityColumns = {
    'locality.geography.$country.name': 'Country',
    'locality.geography.$state.name': 'State',
    'locality.geography.$county.name': 'County',
    'locality.localityname': 'Locality',
    'locality.latitude1': 'Lat',
    'locality.longitude1': 'Lon',
  };

  expect(
    buildGeoLocateData(
      ['USA', 'Kansas', 'Douglas', 'Prairie Park', '', ''],
      headers,
      localityColumns
    )
  ).toEqual({
    country: 'USA',
    state: 'Kansas',
    county: 'Douglas',
    locality: 'Prairie Park',
  });
});

test('includes formatted point data when coordinates are present', () => {
  const headers = ['Country', 'Locality', 'Lat', 'Lon'];
  const localityColumns = {
    'locality.geography.$country.name': 'Country',
    'locality.localityname': 'Locality',
    'locality.latitude1': 'Lat',
    'locality.longitude1': 'Lon',
  };

  expect(
    buildGeoLocateData(
      ['USA', 'Prairie Park', '38:58:48 N', '95:14:24 W'],
      headers,
      localityColumns
    )
  ).toEqual({
    country: 'USA',
    locality: 'Prairie Park',
    points: '38.98|-95.24',
  });
});