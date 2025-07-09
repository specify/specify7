import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../tree';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

const { getUserResources } = exportsForTests;
const { testDisciplines, setAppResourceDir } = utilsForTests;

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

  test("directory case", ()=>{
    const newDirectory = [
        staticAppResources.directories[0],
        {
            ...staticAppResources.directories[1],
            scope: "user",
            collection: staticAppResources.collections[0].resource_uri,
            specifyUser: staticAppResources.users[0].resource_uri
        }
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

    const scopedResources = getUserResources(
        staticAppResources.collections[0],
        {
            ...viewSetAdjusted,
            directories: newDirectory,
            disciplines: testDisciplines
        }
    );

    const collection = staticAppResources.collections[0];

    scopedResources.forEach((resource, index)=>{

        const user = staticAppResources.users[index];
        
        expect(resource.label).toBe(user.name);
        expect(resource.key).toBe(
            `collection_${collection.id}_user_${user.id}`
        );
        expect(resource.directory?.discipline).toBe(
            testDisciplines[0].resource_uri
        );
        expect(resource.directory?.collection).toBe(
            collection.resource_uri
        );
        
        if (index == 0){
            expect(resource.directory?.id).toBe(4);
            expect(resource.appResources).toHaveLength(1);
        }else{
            expect(resource.directory?.id).toBeUndefined();
            expect(resource.appResources).toHaveLength(0);
        }

        expect(resource.viewSets).toHaveLength(0);

    });

  });
});
