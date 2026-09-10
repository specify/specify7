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

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('batch edit rollback availability', () => {
  test.each([
    [false, true, true, true],
    [true, true, true, false],
    [false, false, true, false],
    [false, true, false, false],
    [true, false, true, false],
    [true, true, false, false],
    [false, false, false, false],
    [true, false, false, false],
  ])(
    'enableRelationships=%s showRollback=%s permission=%s -> canUndo=%s',
    (enableRelationships, showRollback, permission, expected) => {
      setBatchEditPreferences(enableRelationships, showRollback);
      mockedHasPermission.mockReturnValue(permission);

      expect(datasetVariants.batchEdit.canUndo()).toBe(expected);
    }
  );

  test('checks the batch edit rollback permission', () => {
    setBatchEditPreferences(false, true);
    mockedHasPermission.mockReturnValue(true);

    datasetVariants.batchEdit.canUndo();

    expect(mockedHasPermission).toHaveBeenCalledWith(
      '/batch_edit/dataset',
      'rollback'
    );
  });