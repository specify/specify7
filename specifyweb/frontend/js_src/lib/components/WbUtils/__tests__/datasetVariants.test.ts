import { hasPermission } from '../../Permissions/helpers';
import { datasetVariants } from '../datasetVariants';

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(),
}));

