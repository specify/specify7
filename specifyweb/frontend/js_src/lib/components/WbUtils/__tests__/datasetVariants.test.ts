// test
import { hasPermission } from '../../Permissions/helpers';
import { userPreferences } from '../../Preferences/userPreferences';
import { datasetVariants } from '../datasetVariants';

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(),
}));

const mockedHasPermission = hasPermission as jest.Mock;

const setBatchEditPreferences = (
  enableRelationships: boolean,
  showRollback: boolean
): void => {
  userPreferences.set(
    'batchEdit',
    'editor',
    'enableRelationships',
    enableRelationships
  );
  userPreferences.set('batchEdit', 'editor', 'showRollback', showRollback);
};
