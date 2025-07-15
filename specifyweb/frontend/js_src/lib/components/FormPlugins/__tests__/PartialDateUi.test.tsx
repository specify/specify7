import { mockTime, requireContext } from '../../../tests/helpers';
import { snapshot } from '../../../tests/reactUtils';
import { PartialDateUi } from '../PartialDateUi';
import { dateTestUtils } from './dateTestUtils';

mockTime();
requireContext();

const { props, getBaseResource } = dateTestUtils;

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
