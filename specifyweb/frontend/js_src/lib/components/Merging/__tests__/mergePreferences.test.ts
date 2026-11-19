import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { addMissingFields } from '../../DataModel/addMissingFields';
import type { AnySchema, SerializedResource } from '../../DataModel/helperTypes';
import { tables } from '../../DataModel/tables';
import { userPreferences } from '../../Preferences/userPreferences';
import {
  autoMerge,
  buildInitialMergedResource,
  postMergeResource,
} from '../autoMerge';

jest.mock('../../Formatters/formatters', () => ({
  format: jest.fn(async (resource) => resource.get('lastName')),
}));

requireContext();

const makeRecords = () =>
  [
    addMissingFields('Agent', {
      id: 1,
      agentType: 1,
      lastName: 'A',
      timestampModified: '2023-01-01T00:00:00',
    }),
    addMissingFields('Agent', {
      id: 2,
      agentType: 2,
      lastName: 'Longer Name',
      timestampModified: '2023-02-01T00:00:00',
    }),
  ] as unknown as RA<SerializedResource<AnySchema>>;

let originalPreferences: ReturnType<typeof userPreferences.getRaw>;

beforeEach(() => {
  originalPreferences = userPreferences.getRaw();
});

afterEach(() => {
  userPreferences.setRaw(originalPreferences);
});

// [RecordMerging] Keep only shared fields without auto populate
test('keeps only shared fields without auto populate', async () => {
  const merged = await buildInitialMergedResource(
    tables.Agent,
    makeRecords(),
    false
  );

  expect(merged.lastName).toBeNull();
  expect(merged.agentType).toBe(1);
});

// [RecordMerging] Auto populate the merge dialog
test('auto populates the merge dialog', async () => {
  const merged = await buildInitialMergedResource(
    tables.Agent,
    makeRecords(),
    true
  );

  expect(merged.lastName).toBe('Longer Name');
});

// [RecordMerging] Do not create agent variants when disabled
test('does not create agent variants when disabled', async () => {
  userPreferences.set('recordMerging', 'agent', 'createVariants', false);
  const records = makeRecords();
  const merged = await postMergeResource(
    records,
    autoMerge(tables.Agent, records, false, 1)
  );

  expect(merged.variants).toEqual([]);
});
