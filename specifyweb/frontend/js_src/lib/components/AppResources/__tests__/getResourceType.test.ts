import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { getAppResourceType, getResourceType } from '../filtersHelpers';
import { staticAppResources } from './staticAppResources';
import { testAppResourcesTypes } from './testAppResourceTypes';

requireContext();

describe('getResourceType', () => {
  test('viewset type', () => {
    expect(getResourceType(staticAppResources.viewSets[0])).toBe('viewSet');
  });

  test('appresource type', () => {
    testAppResourcesTypes.forEach(({ expectedType, ...partialResource }) => {
      expect(
        getResourceType(addMissingFields('SpAppResource', partialResource))
      ).toBe(expectedType);
    });
  });
});

describe('getAppResourceType', () => {
  test('returned type matches expected', () => {
    testAppResourcesTypes.forEach(({ expectedType, ...partialResource }) => {
      expect(
        getAppResourceType(addMissingFields('SpAppResource', partialResource))
      ).toBe(expectedType);
    });
  });
});
