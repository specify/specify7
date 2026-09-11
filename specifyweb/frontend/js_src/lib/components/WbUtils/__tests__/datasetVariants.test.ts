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

// Drop every explicitly set preference so lookups fall back to the defaults 
const resetPreferences = (): void => userPreferences.setRaw({});

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

  test('does not consult permissions when relationships are enabled', () => {
    setBatchEditPreferences(true, true);
    mockedHasPermission.mockReturnValue(true);

    expect(datasetVariants.batchEdit.canUndo()).toBe(false);
    expect(mockedHasPermission).not.toHaveBeenCalled();
  });

  test('rollback is hidden based off default preferences', () => {
    resetPreferences();

    expect(
      userPreferences.definition('batchEdit', 'editor', 'enableRelationships')
        .defaultValue
    ).toBe(true);
    expect(
      userPreferences.definition('batchEdit', 'editor', 'showRollback')
        .defaultValue
    ).toBe(true);

    // Unset preferences resolve to the declared defaults
    expect(
      userPreferences.get('batchEdit', 'editor', 'enableRelationships')
    ).toBe(true);
    expect(userPreferences.get('batchEdit', 'editor', 'showRollback')).toBe(
      true
    );

    expect(datasetVariants.batchEdit.canUndo()).toBe(false);
    expect(mockedHasPermission).not.toHaveBeenCalled();
  });

  test('workbench rollback is not affected by batch edit preferences', () => {
    setBatchEditPreferences(true, true);
    mockedHasPermission.mockReturnValue(true);

    expect(datasetVariants.workbench.canUndo()).toBe(true);
    expect(mockedHasPermission).toHaveBeenCalledWith(
      '/workbench/dataset',
      'unupload'
    );
  });
});