import { csrfToken } from '../../utils/ajax/csrfToken';
import type { MappingRecord } from './types';

export async function cloneMapping(
  mappingId: number
): Promise<MappingRecord> {
  const response = await fetch(`/export/clone_mapping/${mappingId}/`, {
    method: 'POST',
    headers: { 'X-CSRFToken': csrfToken },
  });
  if (!response.ok) throw new Error('Failed to clone mapping');
  return response.json();
}
