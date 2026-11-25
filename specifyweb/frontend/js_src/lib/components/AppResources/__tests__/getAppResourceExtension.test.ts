import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { getAppResourceExtension } from '../hooks';
import { staticAppResources } from './staticAppResources';
import { testAppResourcesTypes } from './testAppResourceTypes';

requireContext();

describe('getAppResourceExtension', () => {
  test('case: spviewset', () => {
    expect(getAppResourceExtension(staticAppResources.viewSets[0])).toBe('xml');
  });

  test('DwCA definitions use XML validation', () => {
    expect(
      getAppResourceExtension(
        addMissingFields('SpAppResource', {
          name: 'DwCA',
          mimeType: 'application/vnd.specify.dwca+xml',
        })
      )
    ).toBe('xml');
  });

  test('appresource type', () => {
    testAppResourcesTypes.forEach(
      ({ extenstion, expectedType, ...partialResource }) => {
        expect(
          getAppResourceExtension(
            addMissingFields('SpAppResource', partialResource)
          )
        ).toBe(extenstion);
      }
    );
  });
});
