import { hasPermission } from '../../Permissions/helpers';
import { userPreferences } from '../../Preferences/userPreferences';
import { datasetVariants } from '../datasetVariants';

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(),
}));

const mockedHasPermission = hasPermission as jest.Mock;

