import { requireContext } from '../../../tests/helpers';
import { overwriteReadOnly } from '../../../utils/types';
import { schema } from '../../DataModel/schema';
import { tables } from '../../DataModel/tables';
import { canMerge } from '../Results';

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasPermission: () => true,
  hasTablePermission: () => true,
}));

requireContext();

const originalEmbeddedCollectingEvent = schema.embeddedCollectingEvent;
const originalEmbeddedPaleoContext = schema.embeddedPaleoContext;

afterEach(() => {
  overwriteReadOnly(
    schema,
    'embeddedCollectingEvent',
    originalEmbeddedCollectingEvent
  );
  overwriteReadOnly(schema, 'embeddedPaleoContext', originalEmbeddedPaleoContext);
});

// [RecordMerging] Hide collecting event merge when embedded
test('hides collecting event merge when embedded', () => {
  overwriteReadOnly(schema, 'embeddedCollectingEvent', true);

  expect(canMerge(tables.CollectingEvent)).toBe(false);
});

// [RecordMerging] Show collecting event merge when not embedded
test('shows collecting event merge when not embedded', () => {
  overwriteReadOnly(schema, 'embeddedCollectingEvent', false);

  expect(canMerge(tables.CollectingEvent)).toBe(true);
});
