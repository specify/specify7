import { exportsForTests } from '../tree';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

const { setAppResourceDir } = utilsForTests;
const { mergeDirectories, getDirectoryChildren } = exportsForTests;

describe('mergeDirectories', () => {
  test('spappresourcedirs matching', () => {
    /*
     * In this case, the spappresources
     * have the dirs in the directory list
     */

    const ids = [3, 3, 4];

    const appResourceAdjusted = ids.reduce(
      (resource, id, index) =>
        setAppResourceDir(resource, 'appResources', index, id),
      staticAppResources
    );

    const viewSetAdjusted = setAppResourceDir(
      appResourceAdjusted,
      'viewSets',
      0,
      3
    );
    const merged = mergeDirectories(
      viewSetAdjusted.directories,
      viewSetAdjusted
    );
    expect(merged.appResources).toHaveLength(3);
    expect(merged.viewSets).toHaveLength(1);
  });

  test('spappresource extra dirs', () => {
    /*
     * In this case, the spappresources
     * have the dirs in the directory list
     */

    const ids = [3, 3, 4];

    const appResourceAdjusted = ids.reduce(
      (resource, id, index) =>
        setAppResourceDir(resource, 'appResources', index, id),
      staticAppResources
    );

    const viewSetAdjusted = setAppResourceDir(
      appResourceAdjusted,
      'viewSets',
      0,
      4
    );

    const testSpec = [
      {
        dirId: 3,
        apps: 2,
        views: 0,
      },
      {
        dirId: 4,
        apps: 1,
        views: 1,
      },
    ] as const;

    testSpec.forEach(({ apps, views }, index) => {
      const merged = mergeDirectories(
        [viewSetAdjusted.directories[index]],
        viewSetAdjusted
      );
      expect(merged.appResources).toHaveLength(apps);
      expect(merged.viewSets).toHaveLength(views);

      const directoryChildren = getDirectoryChildren(
        viewSetAdjusted.directories[index],
        viewSetAdjusted
      );
      expect(directoryChildren.appResources).toHaveLength(apps);
      expect(directoryChildren.viewSets).toHaveLength(views);
    });
  });
});
