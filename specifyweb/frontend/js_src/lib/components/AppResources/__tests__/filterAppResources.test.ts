import { hasPermission } from '../../Permissions/helpers';
import {
  countAppResources,
  defaultAppResourceFilters,
  filterAppResources,
} from '../filtersHelpers';
import { staticAppResources } from './staticAppResources';

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(),
}));

describe('filterAppResources', () => {
  test('case: no appResources filter', () => {
    const filter = {
      appResources: [],
      viewSets: true,
    };

    // New behavior: must mock permission check
    (hasPermission as jest.Mock).mockReturnValue(true);

    const filteredResourcesNoViews = filterAppResources(
      staticAppResources,
      filter
    );

    expect(filteredResourcesNoViews).toEqual({
      ...staticAppResources,
      appResources: [],
    });

    expect(countAppResources(staticAppResources, filter)).toBe(
      staticAppResources.viewSets.length
    );
  });

  test('case: no views filter', () => {
    const filter = {
      ...defaultAppResourceFilters,
      viewSets: false,
    };

    (hasPermission as jest.Mock).mockReturnValue(true);

    const filteredResourcesNoViews = filterAppResources(
      staticAppResources,
      filter
    );

    expect(filteredResourcesNoViews).toEqual({
      ...staticAppResources,
      viewSets: [],
    });

    expect(countAppResources(staticAppResources, filter)).toBe(
      staticAppResources.appResources.length
    );
  });

  test('case: default filter', () => {
    (hasPermission as jest.Mock).mockReturnValue(true);

    const defaultFiltered = filterAppResources(
      staticAppResources,
      defaultAppResourceFilters
    );

    expect(defaultFiltered).toEqual(staticAppResources);

    expect(
      countAppResources(staticAppResources, defaultAppResourceFilters)
    ).toBe(
      staticAppResources.appResources.length +
        staticAppResources.viewSets.length
    );
  });

  test('case: filtered app resources', () => {
    const filter = {
      ...defaultAppResourceFilters,
      appResources: defaultAppResourceFilters.appResources.filter(
        (type) => type !== 'otherXmlResource'
      ),
    };

    (hasPermission as jest.Mock).mockReturnValue(true);

    const expectedResources = {
      ...staticAppResources,
      appResources: staticAppResources.appResources.slice(1),
    };

    expect(filterAppResources(staticAppResources, filter)).toEqual(
      expectedResources
    );

    expect(countAppResources(staticAppResources, filter)).toBe(
      expectedResources.appResources.length + expectedResources.viewSets.length
    );
  });
});
