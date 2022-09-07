import { mockTime } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { parseUiPlugin } from '../plugins';
import { generateInit } from './helpers';

mockTime();

theories(parseUiPlugin, [
  {
    in: [generateInit({}), undefined],
    out: {
      type: 'Unsupported',
      name: undefined,
    },
  },
  {
    in: [generateInit({ name: 'a' }), undefined],
    out: {
      type: 'Unsupported',
      name: 'a',
    },
  },
  {
    in: [generateInit({ name: 'LatLonUI' }), undefined],
    out: {
      type: 'LatLonUI',
      step: undefined,
      latLongType: 'Point',
    },
  },
  {
    in: [
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
    in: [generateInit({ name: 'PartialDateUI' }), undefined],
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
      generateInit({
        name: 'CollectionRelOneToManyPlugin',
        relName: 'abc',
      }),
      undefined,
    ],
    out: {
      type: 'CollectionRelOneToManyPlugin',
      relationship: 'abc',
    },
  },
  {
    in: [
      generateInit({
        name: 'ColRelTypePlugin',
        relName: 'abc',
      }),
      undefined,
    ],
    out: {
      type: 'ColRelTypePlugin',
      relationship: 'abc',
    },
  },
  {
    in: [
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
