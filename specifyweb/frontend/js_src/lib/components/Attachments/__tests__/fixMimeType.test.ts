import { requireContext } from '../../../tests/helpers';
import { fixMimeType } from '../attachments';

requireContext();

describe('fixMimeType', () => {
  test('handles valid mimetype', () => {
    const mimeType = fixMimeType('application/pdf');
    expect(mimeType).toBe('application/pdf');
  });

  test('truncates long mimetype', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const mimeType = fixMimeType('a'.repeat(1025));
    expect(mimeType).toBe('application/octet-stream');
  });
});
