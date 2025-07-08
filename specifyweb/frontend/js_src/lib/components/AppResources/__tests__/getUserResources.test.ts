import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../tree';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

const { getUserResources } = exportsForTests;
const { testDisciplines } = utilsForTests;

requireContext();

describe('getUserResources', () => {
  test('no directory case', () => {
    const scopedResources = getUserResources(
      staticAppResources.collections[0],
      {
        ...staticAppResources,
        directories: [],
        disciplines: testDisciplines,
      }
    );

    expect(scopedResources).toHaveLength(staticAppResources.users.length);

    scopedResources.forEach((resource, index) => {
      const user = staticAppResources.users[index];

      expect(resource.directory?.collection).toBe(
        staticAppResources.collections[0].resource_uri
      );
      expect(resource.directory?.discipline).toBe(
        testDisciplines[0].resource_uri
      );
      expect(resource.directory?.specifyUser).toBe(user.resource_uri);
      expect(resource.directory?.isPersonal).toBe(true);

      expect(resource.label).toBe(user.name);
      expect(resource.key).toBe(
        `collection_${staticAppResources.collections[0].id}_user_${user.id}`
      );
      expect(resource.appResources).toEqual([]);
      expect(resource.viewSets).toEqual([]);
      expect(resource.subCategories).toEqual([]);
    });
  });
});
