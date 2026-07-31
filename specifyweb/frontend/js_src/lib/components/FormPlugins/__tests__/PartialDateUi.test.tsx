import { describe, expect, test } from '@jest/globals';
import { act, render } from '@testing-library/react';
import React from 'react';

import { mockTime, requireContext } from '../../../tests/helpers';
import { snapshot } from '../../../tests/reactUtils';
import { PartialDateUi } from '../PartialDateUi';
import { dateTestUtils } from './dateTestUtils';

mockTime();
requireContext();

const { props, getBaseResource, getResource } = dateTestUtils;

// Snapshot tests
snapshot(PartialDateUi, () => props(getBaseResource()));
snapshot(PartialDateUi, () =>
  props(getBaseResource(), {
    canChangePrecision: false,
    defaultPrecision: 'month-year',
  })
);
snapshot(PartialDateUi, () =>
  props(getBaseResource(), {
    canChangePrecision: false,
    defaultPrecision: 'year',
  })
);

describe('date field change triggers save required (#6699)', () => {
  test('changing date via native picker marks resource as modified', () => {
    const resource = getResource();
    resource.needsSaved = false;

    const { container } = render(
      <PartialDateUi {...props(resource)} />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();

    /*
     * Simulate what a native date picker does: sets value and fires
     * a change event, without a subsequent blur.
     */
    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!;
      nativeInputValueSetter.call(input, '2024-06-15');
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(resource.needsSaved).toBe(true);
  });
});
