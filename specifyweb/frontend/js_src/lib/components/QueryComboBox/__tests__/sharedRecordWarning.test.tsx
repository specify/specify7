/**
 * Tests for shared record edit warning (#597).
 *
 * When using Carry Forward, Specify copies foreign keys — so multiple
 * Collection Objects share the same Locality via their Collecting Event.
 * Clicking the pencil (edit) icon on a non-dependent QueryComboBox field
 * mutates the shared record, silently changing data for all referencing
 * records.
 *
 * The fix shows a warning dialog before editing non-dependent related
 * records, offering Clone and Edit as the primary safe action.
 */

import { requireContext } from '../../../tests/helpers';
import { formsText } from '../../../localization/forms';

requireContext();

describe('Shared record edit warning', () => {
  test('localization strings exist for the warning dialog', () => {
    expect(typeof formsText.sharedRecordWarning()).toBe('string');
    expect(formsText.sharedRecordWarning().length).toBeGreaterThan(0);

    expect(
      typeof formsText.sharedRecordWarningDescription({
        tableName: 'Locality',
        count: '3',
        parentTableName: 'Collecting Event',
      })
    ).toBe('string');

    expect(typeof formsText.editShared()).toBe('string');
    expect(formsText.editShared().length).toBeGreaterThan(0);

    expect(typeof formsText.cloneAndEdit()).toBe('string');
    expect(formsText.cloneAndEdit().length).toBeGreaterThan(0);
  });

  test('warning description includes the table name and count', () => {
    const description = formsText.sharedRecordWarningDescription({
      tableName: 'Locality',
      count: '5',
      parentTableName: 'Collecting Event',
    });
    expect(description).toContain('Locality');
    expect(description).toContain('5');
    expect(description).toContain('Collecting Event');
  });

  test('warning description works for other tables', () => {
    const description = formsText.sharedRecordWarningDescription({
      tableName: 'Agent',
      count: '12',
      parentTableName: 'Collector',
    });
    expect(description).toContain('Agent');
    expect(description).toContain('12');
  });
});
