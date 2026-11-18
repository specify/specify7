import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { deserializeResource } from '../../DataModel/serializers';
import { PickListTypes } from '../definitions';
import { exportsForTests } from '../fetch';

const { fetchPickListItems } = exportsForTests;

requireContext();

const makePickList = (tableName: string, fieldName: string) =>
  deserializeResource(
    addMissingFields('PickList', {
      type: PickListTypes.FIELDS,
      tableName,
      fieldName,
    })
  );

overrideAjax(
  '/table_rows/specify_rows/geologictimeperiod/?limit=0&domainfilter=false&filterchronostrat=true&distinct=true&fields=name',
  [['Paleocene']]
);

// [PickLists] Filter invalid chronostrat names
test('filters chronostrat name pick lists', async () => {
  const items = await fetchPickListItems(
    makePickList('geologictimeperiod', 'name')
  );

  expect(items.map(({ value }) => value)).toEqual(['Paleocene']);
});
