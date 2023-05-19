import {
  defaultTileLayers,
  preferredBaseLayer,
  preferredOverlay,
} from '../layers';

test('preferredBaseLayer is in list of base layers', () =>
  expect(preferredBaseLayer in defaultTileLayers.baseMaps).toBe(true));

test('preferredOverlay is in list of overlays', () =>
  expect(preferredOverlay in defaultTileLayers.overlays).toBe(true));
