import { resourcesText } from '../../../localization/resources';
import { requireContext } from '../../../tests/helpers';
import { replaceItem } from '../../../utils/utils';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { getResourceApiUrl } from '../../DataModel/resource';
import type { AppResources } from '../hooks';
import { getGlobalAllResources } from '../tree';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

const { setAppResourceDir } = utilsForTests;

requireContext();

describe('getGlobalAllResources', () => {
  test('existing directory (global)', () => {
    const appResources = setAppResourceDir(
      staticAppResources,
      'appResources',
      0,
      3
    );
    const globalResources = getGlobalAllResources(appResources);
    expect(globalResources.directory).toEqual(
      staticAppResources.directories[0]
    );

    expect(globalResources.viewSets).toEqual([]);
    expect(globalResources.appResources).toEqual([
      {
        ...staticAppResources.appResources[0],
        spAppResourceDir: getResourceApiUrl('SpAppResourceDir', 3),
      },
      {
        ...staticAppResources.appResources[1],
        label: resourcesText.globalPreferences(),
      },
    ]);
  });

  test('existing directory (remote)', () => {
    const rawAppResources = setAppResourceDir(
      staticAppResources,
      'appResources',
      0,
      3
    );
    const appResources: AppResources = {
      ...rawAppResources,
      directories: replaceItem(rawAppResources.directories, 0, {
        ...rawAppResources.directories[0],
        userType: 'Prefs',
      }),
    };

    const globalResources = getGlobalAllResources(appResources);
    expect(globalResources.directory).toEqual(appResources.directories[0]);

    expect(globalResources.viewSets).toEqual([]);
    expect(globalResources.appResources).toEqual([
      {
        ...appResources.appResources[0],
        spAppResourceDir: getResourceApiUrl('SpAppResourceDir', 3),
      },
      {
        ...appResources.appResources[1],
        label: resourcesText.remotePreferences(),
      },
    ]);
  });

  test('new global directory', () => {
    // For this case, a new global directory will be created...
    const appResources: AppResources = {
      ...staticAppResources,
      directories: [],
    };
    const globalResources = getGlobalAllResources(appResources);

    const newGlobalDirectory = {
      ...addMissingFields('SpAppResourceDir', {
        userType: 'Common',
      }),
      scope: 'global',
    };

    expect(globalResources.directory).toEqual(newGlobalDirectory);

    expect(globalResources.viewSets).toEqual([]);
    expect(globalResources.appResources).toEqual([]);
  });
});
