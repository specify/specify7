import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import type { SpQuery } from '../../DataModel/types';
import { userInformation } from '../../InitialContext/userInformation';
import { cloneSharedQuery } from '../Save';

requireContext();

afterEach(() => jest.restoreAllMocks());

test.each(['Shared query', 'a'.repeat(256), '😀'.repeat(256)])(
  'clones query fields and saves the expected metadata for %s',
  async (name) => {
    const original = new tables.SpQuery.Resource<SpQuery>(
      addMissingFields('SpQuery', {
        id: 33,
        name,
        contextName: 'CollectionObject',
        contextTableId: tables.CollectionObject.tableId,
        specifyUser: `/api/specify/specifyuser/${userInformation.id + 1}/`,
        isFavorite: false,
        fields: [
          addMissingFields('SpQueryField', {
            id: 44,
            fieldName: 'CatalogNumber',
            stringId: '1.collectionobject.catalognumber',
            tableList: '1',
            position: 0,
            operStart: 1,
            startValue: '123',
            isDisplay: true,
            sortType: 1,
          }),
        ],
      })
    );
    const originalData = serializeResource(original);
    const clone = jest.spyOn(original, 'clone');
    let saved: SpecifyResource<SpQuery> | undefined;
    const save = jest
      .spyOn(tables.SpQuery.Resource.prototype, 'save')
      .mockImplementation(async function (this: SpecifyResource<SpQuery>) {
        saved = this;
        this.set('id', 101);
        return this;
      });

    await expect(cloneSharedQuery(original)).resolves.toBe(101);

    expect(clone).toHaveBeenCalledWith(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(saved).toBeDefined();
    if (saved === undefined) throw new Error('Clone was not saved');
    expect(saved).not.toBe(original);
    const savedData = serializeResource(saved);
    expect(savedData.name).toBe(
      `${Array.from(name).slice(0, 247).join('')} - cloned`
    );
    expect(Array.from(savedData.name)).toHaveLength(
      Math.min(Array.from(name).length, 247) + 9
    );
    expect(savedData.specifyUser).toBe(userInformation.resource_uri);
    expect(savedData.isFavorite).toBe(true);
    expect(savedData.contextName).toBe(originalData.contextName);
    expect(savedData.contextTableId).toBe(originalData.contextTableId);
    expect(savedData.fields).toHaveLength(1);
    expect(savedData.fields[0]).toEqual(
      expect.objectContaining({
        fieldName: 'CatalogNumber',
        stringId: '1.collectionobject.catalognumber',
        tableList: '1',
        position: 0,
        operStart: 1,
        startValue: '123',
        isDisplay: true,
        sortType: 1,
      })
    );
    expect(savedData.fields[0].id).not.toBe(44);
    expect(serializeResource(original)).toEqual(originalData);
  }
);
