import { requireContext } from '../../../tests/helpers';
import { getResourceApiUrl } from '../../DataModel/resource';
import { tables } from '../../DataModel/tables';
import { userInformation } from '../../InitialContext/userInformation';
import { useQueryComboBoxDefaults } from '../helpers';

requireContext();

test('Query Combo Box with default record selection', () => {
  const resource = new tables.CollectionObject.Resource();
  expect(resource.get('cataloger')).toBeUndefined();
  const defaultRecord = getResourceApiUrl('Agent', 1);
  useQueryComboBoxDefaults({
    resource,
    field: tables.CollectionObject.strictGetRelationship('cataloger'),
    defaultRecord,
  });
  expect(resource.get('cataloger')).toBe(defaultRecord);
});

test('Query Combo Box with current agent selected', () => {
  const resource = new tables.CollectionObject.Resource();
  expect(resource.get('cataloger')).toBeUndefined();
  const defaultRecord = 'CURRENT_AGENT';
  useQueryComboBoxDefaults({
    resource,
    field: tables.CollectionObject.strictGetRelationship('cataloger'),
    defaultRecord,
  });
  expect(resource.get('cataloger')).toBe(userInformation.agent.resource_uri);
});
test('Query Combo Box with current user selected', () => {
  const resource = new tables.RecordSet.Resource();
  expect(resource.get('specifyUser')).toBeUndefined();
  const defaultRecord = 'CURRENT_USER';
  useQueryComboBoxDefaults({
    resource,
    field: tables.RecordSet.strictGetRelationship('specifyUser'),
    defaultRecord,
  });
  expect(resource.get('specifyUser')).toBe(userInformation.resource_uri);
});

test('Query Combo Box with default record override', () => {
  const resource = new tables.CollectionObject.Resource();
  expect(resource.get('cataloger')).toBeUndefined();
  const defaultRecord = 'BLANK';
  useQueryComboBoxDefaults({
    resource,
    field: tables.CollectionObject.strictGetRelationship('cataloger'),
    defaultRecord,
  });
  expect(resource.get('cataloger')).toBeUndefined();
});
