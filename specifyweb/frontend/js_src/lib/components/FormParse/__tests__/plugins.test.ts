import { mockTime, requireContext } from '../../../tests/helpers';
import { today } from '../../../utils/relativeDate';
import { strictParseXml } from '../../AppResources/parseXml';
import { tables } from '../../DataModel/tables';
import type { SimpleXmlNode } from '../../Syncer/xmlToJson';
import { toSimpleXmlNode, xmlToJson } from '../../Syncer/xmlToJson';
import { parseUiPlugin } from '../plugins';
import { generateInit } from './helpers';

mockTime();
requireContext();

const xml = (xml: string): SimpleXmlNode =>
  toSimpleXmlNode(xmlToJson(strictParseXml(xml)));

const cell = xml(`<cell formatting="test" />`);

const parse = (
  props: Partial<Parameters<typeof parseUiPlugin>[0]>
): ReturnType<typeof parseUiPlugin> =>
  parseUiPlugin({
    cell,
    getProperty: generateInit({}),
    defaultValue: undefined,
    table: tables.Locality,
    fields: undefined,
    ...props,
  });

describe('parseUiPlugin', () => {
  test('Simplest case', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(parse({})).toEqual({
      type: 'Unsupported',
      name: undefined,
    });
  });

  test('Invalid cell', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(parse({ getProperty: generateInit({ name: 'a' }) })).toEqual({
      type: 'Unsupported',
      name: 'a',
    });
  });

  test('Simple Lat Long plugin', () =>
    expect(
      parse({
        getProperty: generateInit({ name: 'LatLonUI' }),
      })
    ).toEqual({
      type: 'LatLonUI',
      step: undefined,
      latLongType: 'Point',
    }));

  test('Lat Long plugin', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'LatLonUI',
          step: '-3.2',
          latLongType: 'Line',
        }),
      })
    ).toEqual({
      type: 'LatLonUI',
      step: -3.2,
      latLongType: 'Line',
    }));

  test('Simplest Partial Date', () =>
    expect(
      parse({
        getProperty: generateInit({ name: 'PartialDateUI' }),
        fields: [tables.Locality.strictGetField('timestampCreated')],
      })
    ).toEqual({
      type: 'PartialDateUI',
      defaultValue: undefined,
      dateFields: ['timestampCreated'],
      canChangePrecision: true,
      precisionField: undefined,
      defaultPrecision: 'full',
    }));

  test('Relative Date', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'PartialDateUI',
          df: 'ABC',
          tp: 'TEST',
          defaultPrecision: 'month-year',
        }),
        fields: [tables.Locality.strictGetField('timestampCreated')],
        defaultValue: `${today} + 3 days`,
      })
    ).toEqual({
      type: 'PartialDateUI',
      defaultValue: new Date('2022-09-03T03:37:10.400Z'),
      dateFields: ['timestampCreated'],
      canChangePrecision: true,
      precisionField: 'test',
      defaultPrecision: 'month-year',
    }));

  test('one-to-many collection relationship', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'CollectionRelOneToManyPlugin',
          relName: 'abc',
        }),
        table: tables.CollectionObject,
      })
    ).toEqual({
      type: 'CollectionRelOneToManyPlugin',
      relationship: 'abc',
      formatting: 'test',
    }));

  test('collection relationship on unsupported table', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(
      parse({
        getProperty: generateInit({
          name: 'ColRelTypePlugin',
          relName: 'abc',
        }),
      })
    ).toEqual({
      type: 'WrongTable',
      supportedTables: ['CollectionObject'],
    });
  });

  test('one-to-one collection relationship', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'ColRelTypePlugin',
          relName: 'abc',
        }),
        table: tables.CollectionObject,
      })
    ).toEqual({
      type: 'ColRelTypePlugin',
      relationship: 'abc',
      formatting: 'test',
    }));

  test('GeoLocate', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'LocalityGeoRef',
        }),
      })
    ).toEqual({
      type: 'LocalityGeoRef',
    }));

  test('Simplest WebLink', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'WebLinkButton',
        }),
      })
    ).toEqual({
      type: 'WebLinkButton',
      webLink: undefined,
      icon: 'WebLink',
    }));

  test('WebLink', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'WebLinkButton',
          webLink: 'abc',
          icon: 'test',
        }),
      })
    ).toEqual({
      type: 'WebLinkButton',
      webLink: 'abc',
      icon: 'test',
    }));

  test('Host Taxon Plugin', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'HostTaxonPlugin',
          relName: 'abc',
        }),
        table: tables.CollectingEventAttribute,
      })
    ).toEqual({
      type: 'HostTaxonPlugin',
      relationship: 'abc',
    }));

  test('GeoMap', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'LocalityGoogleEarth',
          relName: 'abc',
        }),
      })
    ).toEqual({
      type: 'LocalityGoogleEarth',
    }));

  test('PaleoMap', () =>
    expect(
      parse({
        getProperty: generateInit({
          name: 'PaleoMap',
        }),
      })
    ).toEqual({
      type: 'PaleoMap',
    }));
});
