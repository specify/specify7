/**
 * Opening a Locality record must not modify it.
 *
 * LatLongUi recomputes the decimal coordinate from the verbatim text inside a
 * React effect. That effect is keyed on the rendered value, so it fired on the
 * FIRST render — before the user had touched anything — and wrote both the
 * decimal and the (blackList-trimmed) text back onto the resource. The text
 * write was not silent, so simply opening a record marked it dirty; saving it
 * for any unrelated reason then persisted the rewrite.
 *
 * At the California Academy of Sciences this silently moved 2,534 botany
 * localities to the opposite hemisphere: a Spanish "96° 57' O" (Oeste = West,
 * stored -96.95) became "96° 57' " and +96.95, destroying the evidence that the
 * value had ever been West.
 *
 * These tests pin the invariant: render must be read-only with respect to the
 * resource, and a genuine user edit must still update the derived fields.
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { LatLongUi } from '../LatLongUi';

requireContext();

function makeLocality() {
  return new tables.Locality.Resource({
    id: 1,
    localityname: 'Cerro El Veinte',
    lat1text: "17° 33' N",
    latitude1: 17.55,
    long1text: "96° 57' O", // Oeste = West
    longitude1: -96.95,
    srclatlongunit: 2,
  });
}

function makeDecimalOnlyLocality() {
  return new tables.Locality.Resource({
    id: 2,
    localityname: 'Imported, decimal only',
    latitude1: 17.55,
    longitude1: -96.95,
  });
}

describe('LatLongUi does not mutate the resource on render', () => {
  /*
   * Record-set navigation reuses the component instance — useFieldParser says so
   * outright: "Resource changes when sliding in a record selector, but react
   * reuses the DOM component". A one-way "has the value changed" ref therefore
   * stays latched after any edit, leaving the write-back gate open for every
   * record the curator slides to afterwards. That resurrects the corruption in
   * the batch-review workflow, where it does the most damage.
   */
  test('sliding to another record does not rewrite it, even after an edit', async () => {
    const first = makeLocality();
    const { rerender } = render(
      <LatLongUi
        id={undefined}
        latLongType="Point"
        resource={first}
        step={undefined}
      />
    );
    await waitFor(() => expect(first.get('long1text')).toBeDefined());

    // Simulate a real user edit on the first record.
    const input = document.querySelectorAll('input')[1] as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "96° 57' W" } });
    });
    await waitFor(() => expect(first.get('long1text')).toBe("96° 57' W"));

    // Now slide to a different record, as a record set does.
    const second = makeLocality();
    await act(async () => {
      rerender(
        <LatLongUi
          id={undefined}
          latLongType="Point"
          resource={second}
          step={undefined}
        />
      );
    });
    await waitFor(() => expect(second.get('long1text')).toBeDefined());

    expect(second.get('long1text')).toBe("96° 57' O");
    expect(Number(second.get('longitude1'))).toBeCloseTo(-96.95, 6);
    expect(second.needsSaved).toBe(false);
  });

  /*
   * KNOWN REMAINING GAP, deliberately not fixed here.
   *
   * A record imported with only a decimal (typical of WorkBench / LocalityUpdate)
   * still becomes dirty on open: the mount-time back-fill calls updateValue, and
   * useFieldParser writes lat1text NON-silently — a path outside this patch's
   * gate. Nothing is corrupted (the text is generated from the decimal, and the
   * decimal is not rewritten), but the record is flagged as needing saving.
   *
   * Asserted as-is so the limitation is visible rather than assumed fixed. The
   * scope of this patch is therefore "opening cannot CORRUPT a record", not the
   * broader "opening cannot touch a record".
   */
  test('KNOWN GAP: a decimal-only record is still marked dirty on open', async () => {
    const resource = makeDecimalOnlyLocality();
    expect(resource.needsSaved).toBe(false);
    await act(async () => {
      render(
        <LatLongUi
          id={undefined}
          latLongType="Point"
          resource={resource}
          step={undefined}
        />
      );
    });
    await waitFor(() => expect(resource.get('lat1text')).toBeDefined());
    expect(resource.needsSaved).toBe(true);
    // The decimal itself is untouched — no corruption, only a dirty flag.
    expect(Number(resource.get('latitude1'))).toBeCloseTo(17.55, 6);
  });

  test('merely rendering leaves the verbatim text untouched', async () => {
    const resource = makeLocality();
    render(
      <LatLongUi
        id={undefined}
        latLongType="Point"
        resource={resource}
        step={undefined}
      />
    );

    await waitFor(() => expect(resource.get('long1text')).toBeDefined());

    // The O must survive. Previously this became "96° 57' ".
    expect(resource.get('long1text')).toBe("96° 57' O");
    expect(resource.get('lat1text')).toBe("17° 33' N");
  });

  test('merely rendering leaves the decimal untouched', async () => {
    const resource = makeLocality();
    render(
      <LatLongUi
        id={undefined}
        latLongType="Point"
        resource={resource}
        step={undefined}
      />
    );

    await waitFor(() => expect(resource.get('longitude1')).toBeDefined());

    // Previously flipped to +96.95.
    expect(Number(resource.get('longitude1'))).toBeCloseTo(-96.95, 6);
    expect(Number(resource.get('latitude1'))).toBeCloseTo(17.55, 6);
  });

  test('merely rendering does not mark the record as needing saving', async () => {
    const resource = makeLocality();
    expect(resource.needsSaved).toBe(false);

    render(
      <LatLongUi
        id={undefined}
        latLongType="Point"
        resource={resource}
        step={undefined}
      />
    );

    await waitFor(() => expect(resource.get('long1text')).toBeDefined());

    // A dirty record is what let an unrelated Save persist the corruption.
    expect(resource.needsSaved).toBe(false);
  });
});
