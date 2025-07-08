import { getAppResourceMode } from '../helpers';
import { staticAppResources } from './staticAppResources';

describe('getAppResourceMode', () => {
  test('case: appResources mode', () => {
    staticAppResources.appResources.forEach((resource) => {
      expect(getAppResourceMode(resource)).toBe('appResources');
    });
  });

  test('case: viewSets mode', () => {
    staticAppResources.viewSets.forEach((resource) => {
      expect(getAppResourceMode(resource)).toBe('viewSets');
    });
  });
});
