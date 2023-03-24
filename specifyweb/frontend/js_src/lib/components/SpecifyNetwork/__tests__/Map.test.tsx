import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { serializeResource } from '../../DataModel/helpers';
import { getResourceApiUrl } from '../../DataModel/resource';
import { queryFromTree } from '../../QueryBuilder/fromTree';
import { parseQueryFields } from '../../QueryBuilder/helpers';
import { exportsForTests } from '../Map';

requireContext();

const { getFields } = exportsForTests;

const taxonId = 10_442;
const rankId = 2;
const node = {
  id: taxonId,
  fullName: 'Carpiodes velifer',
  definitionItem: getResourceApiUrl('TaxonTreeDefItem', rankId),
  resource_uri: getResourceApiUrl('Taxon', taxonId),
};
overrideAjax(getResourceApiUrl('Taxon', taxonId), () =>
  addMissingFields('Taxon', node)
);

const rank = {
  id: rankId,
  name: 'Species',
  resource_uri: getResourceApiUrl('TaxonTreeDefItem', rankId),
};
overrideAjax(getResourceApiUrl('TaxonTreeDefItem', rankId), () =>
  addMissingFields('TaxonTreeDefItem', rank)
);

test('getFields', async () => {
  const queryResource = await queryFromTree('Taxon', taxonId);
  const query = serializeResource(queryResource);
  const originalFields = parseQueryFields(query.fields ?? []).map(
    ({ mappingPath }) => mappingPath.join('.')
  );
  const newFields = getFields(query);
  const addedFields = newFields.filter(
    ({ mappingPath }) => !originalFields.includes(mappingPath.join('.'))
  );
  const newMappingPaths = new Set(
    newFields.map(({ mappingPath }) => mappingPath.join('.'))
  );
  const removedFields = originalFields.filter(
    (mappingPath) => !newMappingPaths.has(mappingPath)
  );

  expect(removedFields).toEqual([]);
  expect(addedFields).toMatchInlineSnapshot(`
    [
      {
        "filters": [
          {
            "isNot": false,
            "startValue": "",
            "type": "any",
          },
        ],
        "id": 4,
        "isDisplay": true,
        "mappingPath": [
          "collectingEvent",
          "locality",
        ],
        "sortType": undefined,
      },
    ]
  `);
});
