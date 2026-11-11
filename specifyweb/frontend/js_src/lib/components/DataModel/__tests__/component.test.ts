import { resourcesText } from '../../../localization/resources';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { getResourceApiUrl } from '../resource';
import { getFieldBlockers } from '../saveBlockers';
import { tables } from '../tables';

requireContext();

const typeUrl = (id: number) => getResourceApiUrl('CollectionObjectType', id);
const treeUrl = (id: number) => getResourceApiUrl('TaxonTreeDef', id);
overrideAjax(typeUrl(101), {
  id: 101,
  name: 'Botany',
  taxonTreeDef: treeUrl(101),
});
overrideAjax(typeUrl(202), {
  id: 202,
  name: 'Zoology',
  taxonTreeDef: treeUrl(202),
});
overrideAjax(getResourceApiUrl('Taxon', 101), {
  id: 101,
  name: 'Rosa',
  definition: treeUrl(101),
});

test('changing Type blocks saving a taxon from the previous tree and restoring Type clears the blocker', async () => {
  const component = new tables.Component.Resource({
    type: typeUrl(101),
    name: getResourceApiUrl('Taxon', 101),
  });
  await component.businessRuleManager!.checkField('type');
  const blockers = () =>
    getFieldBlockers(component, tables.Component.field.name);
  expect(blockers()).toEqual([]);

  component.set('type', typeUrl(202));
  await component.businessRuleManager!.pendingPromise;
  expect(blockers()).toEqual([
    resourcesText.invalidNameTaxon({
      taxonName: tables.Component.field.name.label,
      taxonTableLabel: tables.Taxon.label,
      typeName: tables.Component.label,
    }),
  ]);

  component.set('type', typeUrl(101));
  await component.businessRuleManager!.pendingPromise;
  expect(blockers()).toEqual([]);
});

test('clearing an invalid taxon clears its save blocker', async () => {
  const component = new tables.Component.Resource({
    type: typeUrl(202),
    name: getResourceApiUrl('Taxon', 101),
  });
  await component.businessRuleManager!.checkField('type');
  expect(getFieldBlockers(component, tables.Component.field.name)).toHaveLength(
    1
  );
  component.set('name', null);
  await component.businessRuleManager!.pendingPromise;
  expect(getFieldBlockers(component, tables.Component.field.name)).toEqual([]);
});
