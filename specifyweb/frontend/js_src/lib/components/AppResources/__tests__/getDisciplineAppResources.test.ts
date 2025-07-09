import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../tree';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

const { testDisciplines, setAppResourceDir } = utilsForTests;
const { getDisciplineAppResources } = exportsForTests;

requireContext();

describe('getDisciplineAppResources', () => {
  test('no directory case', () => {
    const scoped = getDisciplineAppResources(testDisciplines[0], {
      ...staticAppResources,
      directories: [],
      disciplines: testDisciplines,
    });
    expect(scoped[0].label).toBe(
      staticAppResources.collections[0].collectionName
    );
    expect(scoped[0].key).toBe(
      `collection_${staticAppResources.collections[0].id}`
    );

    // This directory will be created newly (wouldn't have an ID too)
    expect(scoped[0].directory?.id).toBeUndefined();
    expect(scoped[0].directory?.discipline).toBe(
      testDisciplines[0].resource_uri
    );
    expect(scoped[0].directory?.collection).toBe(
      staticAppResources.collections[0].resource_uri
    );

    expect(scoped[0].appResources).toEqual([]);
    expect(scoped[0].viewSets).toEqual([]);
  });

  test('directory case', () => {
    const newDirectory = [
      staticAppResources.directories[0],
      {
        ...staticAppResources.directories[1],
        scope: 'collection',
        collection: staticAppResources.collections[0].resource_uri,
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

    const scoped = getDisciplineAppResources(testDisciplines[0], {
      ...viewSetAdjusted,
      directories: newDirectory,
      disciplines: testDisciplines,
    });

    expect(scoped[0].label).toBe('KUFishTeaching');
    expect(scoped[0].key).toBe('collection_65536');

    expect(scoped[0].directory?.id).toBe(4);

    expect(scoped[0].appResources).toEqual([viewSetAdjusted.appResources[2]]);
    expect(scoped[0].viewSets).toEqual([]);
  });
});
