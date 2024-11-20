import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { getResourceApiUrl } from '../../DataModel/resource';
import { serializeResource } from '../../DataModel/serializers';
import { queryFromTree } from '../../QueryBuilder/fromTree';
import { parseQueryFields } from '../../QueryBuilder/helpers';
import { exportsForTests, extractQueryTaxonId } from '../Map';

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

test('getFields and extractQueryTaxonId', async () => {
  const queryResource = await queryFromTree('Taxon', taxonId);
  const query = serializeResource(queryResource);

  /*
   * Even though locality is part of the query at the moment, remove it to
   * test if the code
   * can detect that it's missing and add it back. This would be useful in
   * the future once users would be able to customize the query from tree
   * (https://github.com/specify/specify7/issues/2703)
   */
  const queryWithoutLocality = {
    ...query,
    fields: query.fields.filter(
      (field) => !field.stringId.includes('locality')
    ),
  };

  const originalFields = parseQueryFields(
    queryWithoutLocality.fields ?? []
  ).map(({ mappingPath }) => mappingPath.join('.'));
  const newFields = getFields(queryWithoutLocality);
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
        "dataObjFormatter": undefined,
        "filters": [
          {
            "isNot": false,
            "isStrict": false,
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

  expect(extractQueryTaxonId('CollectionObject', newFields)).toBe(taxonId);
});
