import { requireContext } from '../../../tests/helpers';
import { getResourceApiUrl } from '../../DataModel/resource';
import { useQueryComboBoxDefaults } from '../helpers';
import { tables } from '../../DataModel/tables';
import { userInformation } from '../../InitialContext/userInformation';

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

test('Query Combo Box with current user selected', () => {
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