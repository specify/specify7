import { requireContext } from '../../../tests/helpers';
import { userTypes } from '../../PickLists/definitions';
import { exportsForTests } from '../tree';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

const { getUserTypeResources } = exportsForTests;
const { testDisciplines, setAppResourceDir } = utilsForTests;

requireContext();

describe('getUserTypeResources', () => {
  test('no directory case', () => {
    const scopedResources = getUserTypeResources(
      staticAppResources.collections[0],
      {
        ...staticAppResources,
        directories: [],
        disciplines: testDisciplines,
      }
    );
    expect(scopedResources).toHaveLength(4);
    scopedResources.forEach((resource, index) => {
      const userType = userTypes[index];
      expect(resource.label).toBe(userType);
      expect(resource.key).toBe(
        `collection_${staticAppResources.collections[0].id}_userType_${userType}`
      );
      expect(resource.directory?.id).toBeUndefined();
      expect(resource.directory?.discipline).toBe(
        testDisciplines[0].resource_uri
      );
      expect(resource.directory?.collection).toBe(
        staticAppResources.collections[0].resource_uri
      );
      expect(resource.directory?.userType?.toLowerCase()).toBe(
        userType.toLowerCase()
      );
      expect(resource.appResources).toEqual([]);
      expect(resource.viewSets).toEqual([]);
    });
  });

  test('directory case', () => {
    const newDirectory = [
      staticAppResources.directories[0],
      {
        ...staticAppResources.directories[1],
        scope: 'userType',
        collection: staticAppResources.collections[0].resource_uri,
        userType: 'Manager',
      },
    ] as const;

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

    const scopedResources = getUserTypeResources(
      staticAppResources.collections[0],
      {
        ...viewSetAdjusted,
        directories: newDirectory,
        disciplines: testDisciplines,
      }
    );

    expect(scopedResources).toHaveLength(4);
    scopedResources.forEach((resource, index) => {
      const userType = userTypes[index];
      expect(resource.label).toBe(userType);
      expect(resource.key).toBe(
        `collection_${staticAppResources.collections[0].id}_userType_${userType}`
      );
      expect(resource.directory?.discipline).toBe(
        testDisciplines[0].resource_uri
      );
      expect(resource.directory?.collection).toBe(
        staticAppResources.collections[0].resource_uri
      );
      expect(resource.directory?.userType?.toLowerCase()).toBe(
        userType.toLowerCase()
      );

      if (index == 0) {
        expect(resource.directory?.id).toBe(4);
        expect(resource.appResources).toHaveLength(1);
      } else {
        expect(resource.directory?.id).toBeUndefined();
        expect(resource.appResources).toHaveLength(0);
      }

      expect(resource.viewSets).toHaveLength(0);
    });
  });
});
