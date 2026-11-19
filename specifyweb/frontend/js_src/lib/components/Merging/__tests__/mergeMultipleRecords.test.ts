import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { addMissingFields } from '../../DataModel/addMissingFields';
import type { AnySchema, SerializedResource } from '../../DataModel/helperTypes';
import { tables } from '../../DataModel/tables';
import { autoMerge } from '../autoMerge';

requireContext();

const makeLocality = (id: number, localityName: string) =>
  addMissingFields('Locality', {
    id,
    localityName,
    timestampModified: `2023-01-0${id}T00:00:00`,
  }) as unknown as SerializedResource<AnySchema>;

// [RecordMerging] Merge multiple localities
test('merges multiple localities', () => {
  const records = [
    makeLocality(1, 'L1'),
    makeLocality(2, 'Locality Two'),
    makeLocality(3, 'Locality Number Three'),
  ] as RA<SerializedResource<AnySchema>>;

  const merged = autoMerge(tables.Locality, records, false);

  expect(merged.localityName).toBe('Locality Number Three');
});

const makePaleoContext = (id: number, paleoContextName: string) =>
  addMissingFields('PaleoContext', {
    id,
    paleoContextName,
    timestampModified: `2023-01-0${id}T00:00:00`,
  }) as unknown as SerializedResource<AnySchema>;

// [RecordMerging] Merge multiple paleo contexts
test('merges multiple paleo contexts', () => {
  const records = [
    makePaleoContext(1, 'P1'),
    makePaleoContext(2, 'Paleo Context Two'),
    makePaleoContext(3, 'Paleo Context Number Three'),
  ] as RA<SerializedResource<AnySchema>>;

  const merged = autoMerge(tables.PaleoContext, records, false);

  expect(merged.paleoContextName).toBe('Paleo Context Number Three');
});
