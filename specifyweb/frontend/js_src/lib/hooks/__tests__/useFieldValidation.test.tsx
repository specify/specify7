/**
 * NOTES:
 * These tests are, mostly, covered in the tests for useResourceValue (which calls this hook).
 * That is, this hook has decent code coverage (100%, and 50% branch coverage) through tests
 * in useResourceValue.
 * But, having an independent test for this important hook is worth it.
 */
import { act, renderHook } from '@testing-library/react';

import { getFieldBlockers } from '../../components/DataModel/saveBlockers';
import { tables } from '../../components/DataModel/tables';
import { requireContext } from '../../tests/helpers';
import type { RA } from '../../utils/types';
import { useFieldValidation } from '../useFieldValidation';

requireContext();

describe('useFieldValidation', () => {
  // TODO: make this part of utils?
  const expectArrayEqual = (base: RA<unknown>, compare: RA<unknown>) => {
    expect(base).toHaveLength(compare.length);
    base.forEach((baseElement, index) =>
      expect(baseElement).toBe(compare[index])
    );
  };

  test('blocker(s) get set', () => {
    const collectionObject = new tables.CollectionObject.Resource({ id: 1 });

    const textField = tables.CollectionObject.strictGetField('text1');

    const { result } = renderHook(() =>
      useFieldValidation(collectionObject, textField)
    );

    // We don't bother mounting for testing this hook.
    expectArrayEqual(getFieldBlockers(collectionObject, textField), []);

    const simpleErrors = [
      'value is not correct',
      "value does not begin with 'A'",
    ];
    const customError = 'this is custom';
    const customErrorKey = 'custom_blocker';

    act(() => result.current.setValidation(simpleErrors));

    expectArrayEqual(
      getFieldBlockers(collectionObject, textField),
      simpleErrors
    );

    act(() => result.current.setValidation(customError, customErrorKey));

    expectArrayEqual(
      getFieldBlockers(collectionObject, textField, customErrorKey),
      [customError]
    );

    expectArrayEqual(getFieldBlockers(collectionObject, textField), [
      ...simpleErrors,
      customError,
    ]);
  });
});
