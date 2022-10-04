import { mockTime } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { parseUiPlugin } from '../plugins';
import { generateInit } from './helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';

mockTime();

const cell = strictParseXml(`<cell formatting="test" />`);

theories(parseUiPlugin, [
  {
    in: [cell, generateInit({}), undefined],
    out: {
      type: 'Unsupported',
      name: undefined,
    },
  },
  {
    in: [cell, generateInit({ name: 'a' }), undefined],
    out: {
      type: 'Unsupported',
      name: 'a',
    },
  },
  {
    in: [cell, generateInit({ name: 'LatLonUI' }), undefined],
    out: {
      type: 'LatLonUI',
      step: undefined,
      latLongType: 'Point',
    },
  },
  {
    in: [
      cell,
      generateInit({ name: 'LatLonUI', step: '-3.2', latLongType: 'Line' }),
      undefined,
    ],
    out: {
      type: 'LatLonUI',
      step: -3.2,
      latLongType: 'Line',
    },
  },
  {
    in: [cell, generateInit({ name: 'PartialDateUI' }), undefined],
    out: {
      type: 'PartialDateUI',
      defaultValue: undefined,
      dateField: undefined,
      precisionField: undefined,
      defaultPrecision: 'full',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'PartialDateUI',
        df: 'ABC',
        tp: 'TEST',
        defaultPrecision: 'month-year',
      }),
      'today + 3 days',
    ],
    out: {
      type: 'PartialDateUI',
      defaultValue: new Date('2022-09-03T03:37:10.400Z'),
      dateField: 'abc',
      precisionField: 'test',
      defaultPrecision: 'month-year',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'CollectionRelOneToManyPlugin',
        relName: 'abc',
      }),
      undefined,
    ],
    out: {
      type: 'CollectionRelOneToManyPlugin',
      relationship: 'abc',
      formatting: 'test',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'ColRelTypePlugin',
        relName: 'abc',
      }),
      undefined,
    ],
    out: {
      type: 'ColRelTypePlugin',
      relationship: 'abc',
      formatting: 'test',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'LocalityGeoRef',
      }),
      undefined,
    ],
    out: {
      type: 'LocalityGeoRef',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'WebLinkButton',
        webLink: 'abc',
        icon: 'test',
      }),
      undefined,
    ],
    out: {
      type: 'WebLinkButton',
      webLink: 'abc',
      icon: 'test',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'WebLinkButton',
      }),
      undefined,
    ],
    out: {
      type: 'WebLinkButton',
      webLink: undefined,
      icon: 'WebLink',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'AttachmentPlugin',
      }),
      undefined,
    ],
    out: {
      type: 'AttachmentPlugin',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'HostTaxonPlugin',
        relName: 'abc',
      }),
      undefined,
    ],
    out: {
      type: 'HostTaxonPlugin',
      relationship: 'abc',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'LocalityGoogleEarth',
        relName: 'abc',
      }),
      undefined,
    ],
    out: {
      type: 'LocalityGoogleEarth',
    },
  },
  {
    in: [
      cell,
      generateInit({
        name: 'PaleoMap',
      }),
      undefined,
    ],
    out: {
      type: 'PaleoMap',
    },
  },
]);
