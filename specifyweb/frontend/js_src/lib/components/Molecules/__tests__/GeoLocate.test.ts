import { sanitizeGeoLocateData } from '../GeoLocate';

describe('sanitizeGeoLocateData', () => {
  test('removes double quotes from locality name', () => {
    const data = { locality: 'Near "Big Rock" Creek', country: 'US' };
    const result = sanitizeGeoLocateData(data);
    expect(result.locality).toBe('Near Big Rock Creek');
    expect(result.country).toBe('US');
  });

  test('removes single quotes from locality name', () => {
    const data = { locality: "O'Brien's Landing", state: 'California' };
    const result = sanitizeGeoLocateData(data);
    expect(result.locality).toBe('OBriens Landing');
    expect(result.state).toBe('California');
  });

  test('removes mixed quotes from locality name', () => {
    const data = { locality: `He said "it's here"`, county: 'Marin' };
    const result = sanitizeGeoLocateData(data);
    expect(result.locality).toBe('He said its here');
    expect(result.county).toBe('Marin');
  });

  test('passes through values without quotes unchanged', () => {
    const data = {
      locality: 'Normal Locality Name',
      country: 'United States',
      state: 'California',
      points: '37.7749|-122.4194|Normal Locality Name|',
    };
    const result = sanitizeGeoLocateData(data);
    expect(result).toStrictEqual(data);
  });

  test('sanitizes quotes in all fields including points', () => {
    const data = {
      locality: "Lake O'Neill",
      points: "33.2|-117.3|Lake O'Neill|",
    };
    const result = sanitizeGeoLocateData(data);
    expect(result.locality).toBe('Lake ONeill');
    expect(result.points).toBe('33.2|-117.3|Lake ONeill|');
  });
});
