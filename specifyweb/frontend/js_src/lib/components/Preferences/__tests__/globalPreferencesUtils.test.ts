import {
  DEFAULT_VALUES,
  mergeWithDefaultValues,
  partialPreferencesFromMap,
  serializeGlobalPreferences,
  setGlobalPreferenceFallback,
} from '../globalPreferencesUtils';

describe('globalPreferencesUtils', () => {
  beforeEach(() => {
    setGlobalPreferenceFallback(DEFAULT_VALUES);
  });

  it('builds partial values from remote preferences map', () => {
    const partial = partialPreferencesFromMap({
      'ui.formatting.scrdateformat': 'MM/dd/yyyy',
      'auditing.do_audits': 'false',
    });

    expect(partial.formatting?.formatting?.fullDateFormat).toBe('MM/DD/YYYY');
    expect(partial.auditing?.auditing?.enableAuditLog).toBe(false);
    expect(partial.attachments).toBeUndefined();
  });

  it('merges partial values with fallback defaults', () => {
    const remotePartial = partialPreferencesFromMap({
      'ui.formatting.scrdateformat': 'MM/dd/yyyy',
    });

    const merged = mergeWithDefaultValues(remotePartial);

    expect(merged.formatting.formatting.fullDateFormat).toBe('MM/DD/YYYY');
    expect(merged.attachments.attachments.attachmentThumbnailSize).toBe(
      DEFAULT_VALUES.attachments.attachments.attachmentThumbnailSize
    );
  });

  it('serializes using configured fallback values', () => {
    const fallback = mergeWithDefaultValues(
      partialPreferencesFromMap({
        'ui.formatting.scrdateformat': 'MM/dd/yyyy',
      })
    );
    setGlobalPreferenceFallback(fallback);

    const { data } = serializeGlobalPreferences(undefined, [], { fallback });

    expect(data).toContain('ui.formatting.scrdateformat=MM/DD/YYYY');
    expect(data).toContain('auditing.do_audits=true');
  });
});
