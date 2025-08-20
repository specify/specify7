import { requireContext } from '../../../tests/helpers';
import { getScopedAppResources } from '../tree';
import { staticAppResources } from './staticAppResources';
import { utilsForTests } from './utils';

const { testDisciplines, setAppResourceDir } = utilsForTests;

requireContext();

describe('getScopedAppResources', () => {
  test('no directory case', () => {
    const scoped = getScopedAppResources({
      ...staticAppResources,
      directories: [],
      disciplines: testDisciplines,
    });
    expect(scoped[0].label).toBe(testDisciplines[0].name);
    expect(scoped[0].key).toBe(`discipline_${testDisciplines[0].id}`);

    // This directory will be created newly (wouldn't have an ID too)
    expect(scoped[0].directory?.id).toBeUndefined();
    expect(scoped[0].directory?.discipline).toBe(
      testDisciplines[0].resource_uri
    );

    /*
     * BUG: This is not correct.
     * expect(scoped[0].directory?.collection).toBe(undefined);
     */

    expect(scoped[0].appResources).toEqual([]);
    expect(scoped[0].viewSets).toEqual([]);
  });

  test('directory case', () => {
    const newDirectory = [
      staticAppResources.directories[0],
      {
        ...staticAppResources.directories[1],
        scope: 'discipline',
        collection: null,
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
    const scoped = getScopedAppResources({
      ...viewSetAdjusted,
      directories: newDirectory,
      disciplines: testDisciplines,
    });
    expect(scoped[0].label).toBe('Ichthyology');
    expect(scoped[0].key).toBe('discipline_3');

    expect(scoped[0].directory?.id).toBe(4);

    expect(scoped[0].appResources).toEqual([viewSetAdjusted.appResources[2]]);
    expect(scoped[0].viewSets).toEqual([]);
  });
});
