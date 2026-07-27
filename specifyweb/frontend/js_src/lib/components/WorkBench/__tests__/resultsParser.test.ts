import { backEndText } from '../../../localization/backEnd';
import { requireContext } from '../../../tests/helpers';

import { resolveValidationMessage } from '../resultsParser';

requireContext();

describe('resolveValidationMessage business-rule handling', () => {
  test('formats childFieldNotUnique and appends conflicting record ids', () => {
    const message = resolveValidationMessage('notAParsingKey', {
      localizationKey: 'childFieldNotUnique',
      table: 'Collectionobject',
      fieldName: 'catalognumber',
      parentField: 'collection',
      conflicting: [4, 9],
    });

    const localizedSuffix = backEndText.conflictingRecordIds({ ids: '4, 9' });

    expect(message).toContain('unique');
    expect(message).toContain(localizedSuffix);
  });

  test('does not append conflicting ids when no valid ids are provided', () => {
    const message = resolveValidationMessage('notAParsingKey', {
      localizationKey: 'childFieldNotUnique',
      table: 'Collectionobject',
      fieldName: 'catalognumber',
      parentField: 'collection',
      conflicting: [{ id: 4 }],
    });

    expect(message).toContain('unique');
    expect(message).not.toContain('Conflicting record IDs:');
  });

  test('falls back to generic message when business-rule payload has no table', () => {
    const payload = {
      localizationKey: 'fieldNotUnique',
      fieldName: 'catalognumber',
      conflicting: [4],
    };

    expect(resolveValidationMessage('unknownKey', payload)).toBe(
      `unknownKey ${JSON.stringify(payload)}`
    );
  });

  test('parsing message takes precedence over business-rule message', () => {
    const message = resolveValidationMessage('failedParsingBoolean', {
      localizationKey: 'childFieldNotUnique',
      table: 'Collectionobject',
      fieldName: 'catalognumber',
      parentField: 'collection',
      value: 'not-a-bool',
      conflicting: [4],
    });

    expect(message).toBe(
      backEndText.failedParsingBoolean({ value: 'not-a-bool' })
    );
  });
});
