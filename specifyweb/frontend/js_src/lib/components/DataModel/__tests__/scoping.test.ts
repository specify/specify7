import { requireContext } from '../../../tests/helpers';
import { remotePrefs } from '../../InitialContext/remotePrefs';
import { schema } from '../schema';
import { tables } from '../tables';

requireContext();

/*
 * These tests mutate the real pref store instead, covering read -> apply.
 */
describe('CO_CREATE remote prefs applied on new CollectionObject', () => {
  const collectionPrefKeys = (): string[] => {
    const collectionId = schema.domainLevelIds.collection;
    return [
      `CO_CREATE_COA_${collectionId}`,
      `CO_CREATE_PREP_${collectionId}`,
      `CO_CREATE_DET_${collectionId}`,
    ];
  };

  const setPrefs = (value: string): void =>
    collectionPrefKeys().forEach((key) => {
      (remotePrefs as Record<string, string>)[key] = value;
    });

  afterEach(() => {
    collectionPrefKeys().forEach((key) => {
      delete (remotePrefs as Record<string, string>)[key];
    });
  });

  test('creates COA, Preparation and Determination when prefs are true', async () => {
    setPrefs('true');

    const collectionObject = new tables.CollectionObject.Resource();

    expect(collectionObject.get('collectionObjectAttribute')).toBe(
      '/api/specify/collectionobjectattribute/'
    );

    await expect(
      collectionObject
        .rgetCollection('preparations')
        .then((collection) => collection.models.length)
    ).resolves.toBe(1);

    expect(
      collectionObject.getDependentResource('determinations')
    ).toHaveLength(1);
  });
});
