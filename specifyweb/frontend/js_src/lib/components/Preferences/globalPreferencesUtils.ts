import type { PreferenceItem } from './types';
import type { GlobalPreferenceValues } from './globalPreferences';
import { FULL_DATE_FORMAT_OPTIONS, MONTH_YEAR_FORMAT_OPTIONS } from './GlobalDefinitions';

export type PropertyLine =
  | { readonly type: 'comment' | 'empty'; readonly raw: string }
  | {
      readonly type: 'entry';
      readonly key: string;
      readonly value: string;
      readonly raw: string;
    };

const PREFERENCE_KEYS = {
  enableAuditLog: 'auditing.do_audits',
  logFieldLevelChanges: 'auditing.audit_field_updates',
  fullDateFormat: 'ui.formatting.scrdateformat',
  monthYearDateFormat: 'ui.formatting.scrmonthformat',
  attachmentThumbnailSize: 'attachment.preview_size',
} as const;

type ParsedProperties = {
  readonly lines: ReadonlyArray<PropertyLine>;
  readonly map: Record<string, string>;
};

const DATE_FORMAT_NORMALIZER = new Set<string>([
  ...FULL_DATE_FORMAT_OPTIONS,
  ...MONTH_YEAR_FORMAT_OPTIONS,
]);

export const DEFAULT_VALUES: GlobalPreferenceValues = {
  auditing: {
    auditing: {
      enableAuditLog: true,
      logFieldLevelChanges: true,
    },
  },
  formatting: {
    formatting: {
      fullDateFormat: 'YYYY-MM-DD',
      monthYearDateFormat: 'YYYY-MM',
    },
  },
  attachments: {
    attachments: {
      attachmentThumbnailSize: 256,
    },
  },
};

let globalPreferenceFallback: GlobalPreferenceValues = DEFAULT_VALUES;

export function setGlobalPreferenceFallback(
  fallback: GlobalPreferenceValues
): void {
  globalPreferenceFallback = fallback;
}

export function getGlobalPreferenceFallback(): GlobalPreferenceValues {
  return globalPreferenceFallback;
}

function normalizeFormat(value: string): string {
  const upper = value.toUpperCase();
  return DATE_FORMAT_NORMALIZER.has(upper) ? upper : upper;
}

function parseProperties(data: string): ParsedProperties {
  const lines = data.split(/\r?\n/u);
  const parsed: PropertyLine[] = [];
  const map: Record<string, string> = {};

  lines.forEach((line) => {
    if (line.trim().length === 0) parsed.push({ type: 'empty', raw: line });
    else if (line.trimStart().startsWith('#'))
      parsed.push({ type: 'comment', raw: line });
    else {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        parsed.push({ type: 'comment', raw: line });
        return;
      }
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      map[key] = value;
      parsed.push({ type: 'entry', key, value, raw: `${key}=${value}` });
    }
  });

  return { lines: parsed, map };
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
}

function parseNumber(value: string | undefined): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function hasProperties<T extends Record<string, unknown>>(object: T): object is T {
  return Object.keys(object).length > 0;
}

export function partialPreferencesFromMap(
  map: Readonly<Record<string, string>>
): Partial<GlobalPreferenceValues> {
  const partial: Partial<GlobalPreferenceValues> = {};

  const auditing: Partial<GlobalPreferenceValues['auditing']['auditing']> = {};
  const enableAuditLog = parseBoolean(map[PREFERENCE_KEYS.enableAuditLog]);
  if (enableAuditLog !== undefined) auditing.enableAuditLog = enableAuditLog;

  const logFieldLevelChanges = parseBoolean(map[PREFERENCE_KEYS.logFieldLevelChanges]);
  if (logFieldLevelChanges !== undefined)
    auditing.logFieldLevelChanges = logFieldLevelChanges;

  if (hasProperties(auditing)) {
    partial.auditing = {
      auditing: auditing as GlobalPreferenceValues['auditing']['auditing'],
    };
  }

  const formatting: Partial<GlobalPreferenceValues['formatting']['formatting']> = {};
  const fullDateFormatRaw = map[PREFERENCE_KEYS.fullDateFormat];
  if (fullDateFormatRaw !== undefined)
    formatting.fullDateFormat = normalizeFormat(fullDateFormatRaw);

  const monthYearDateFormatRaw = map[PREFERENCE_KEYS.monthYearDateFormat];
  if (monthYearDateFormatRaw !== undefined) {
    const monthYearFormat = normalizeFormat(monthYearDateFormatRaw);
    if (
      MONTH_YEAR_FORMAT_OPTIONS.includes(
        monthYearFormat as (typeof MONTH_YEAR_FORMAT_OPTIONS)[number]
      )
    )
      formatting.monthYearDateFormat = monthYearFormat;
  }

  if (hasProperties(formatting)) {
    partial.formatting = {
      formatting: formatting as GlobalPreferenceValues['formatting']['formatting'],
    };
  }

  const attachments: Partial<GlobalPreferenceValues['attachments']['attachments']> = {};
  const attachmentThumbnailSize = parseNumber(
    map[PREFERENCE_KEYS.attachmentThumbnailSize]
  );
  if (attachmentThumbnailSize !== undefined)
    attachments.attachmentThumbnailSize = attachmentThumbnailSize;

  if (hasProperties(attachments)) {
    partial.attachments = {
      attachments: attachments as GlobalPreferenceValues['attachments']['attachments'],
    };
  }

  return partial;
}

export function mergeWithDefaultValues(
  values: Partial<GlobalPreferenceValues> | undefined,
  fallback: GlobalPreferenceValues = globalPreferenceFallback
): GlobalPreferenceValues {
  const merged = values ?? {};
  return {
    auditing: {
      auditing: {
        enableAuditLog:
          merged.auditing?.auditing?.enableAuditLog ??
          fallback.auditing.auditing.enableAuditLog,
        logFieldLevelChanges:
          merged.auditing?.auditing?.logFieldLevelChanges ??
          fallback.auditing.auditing.logFieldLevelChanges,
      },
    },
    formatting: {
      formatting: {
        fullDateFormat:
          merged.formatting?.formatting?.fullDateFormat ??
          fallback.formatting.formatting.fullDateFormat,
        monthYearDateFormat:
          merged.formatting?.formatting?.monthYearDateFormat ??
          fallback.formatting.formatting.monthYearDateFormat,
      },
    },
    attachments: {
      attachments: {
        attachmentThumbnailSize:
          merged.attachments?.attachments?.attachmentThumbnailSize ??
          fallback.attachments.attachments.attachmentThumbnailSize,
      },
    },
  };
}

export function parseGlobalPreferences(
  data: string | null
): {
  readonly raw: Partial<GlobalPreferenceValues>;
  readonly metadata: ReadonlyArray<PropertyLine>;
} {
  const parsed = parseProperties(data ?? '');
  const values = partialPreferencesFromMap(parsed.map);
  return { raw: values, metadata: parsed.lines };
}

function preferencesToKeyValue(values: GlobalPreferenceValues): Record<string, string> {
  return {
    [PREFERENCE_KEYS.enableAuditLog]: values.auditing.auditing.enableAuditLog ? 'true' : 'false',
    [PREFERENCE_KEYS.logFieldLevelChanges]: values.auditing.auditing.logFieldLevelChanges
      ? 'true'
      : 'false',
    [PREFERENCE_KEYS.fullDateFormat]: normalizeFormat(values.formatting.formatting.fullDateFormat),
    [PREFERENCE_KEYS.monthYearDateFormat]: normalizeFormat(
      values.formatting.formatting.monthYearDateFormat
    ),
    [PREFERENCE_KEYS.attachmentThumbnailSize]: values.attachments.attachments.attachmentThumbnailSize.toString(),
  };
}

export function applyUpdates(
  lines: ReadonlyArray<PropertyLine>,
  updates: Record<string, string>
): { readonly lines: ReadonlyArray<PropertyLine>; readonly text: string } {
  const remaining = new Set(Object.keys(updates));
  const updatedLines = lines.map((line) => {
    if (line.type === 'entry' && remaining.has(line.key)) {
      const value = updates[line.key];
      remaining.delete(line.key);
      return { type: 'entry', key: line.key, value, raw: `${line.key}=${value}` } as PropertyLine;
    }
    return line;
  });

  const appended: PropertyLine[] = Array.from(remaining).map((key) => ({
    type: 'entry',
    key,
    value: updates[key],
    raw: `${key}=${updates[key]}`,
  }));

  const finalLines = [...updatedLines, ...appended];
  return { lines: finalLines, text: finalLines.map((line) => line.raw).join('\n') };
}

export function serializeGlobalPreferences(
  raw: GlobalPreferenceValues | Partial<GlobalPreferenceValues> | undefined,
  metadata: ReadonlyArray<PropertyLine>,
  options?: { readonly fallback?: GlobalPreferenceValues }
): { readonly data: string; readonly metadata: ReadonlyArray<PropertyLine> } {
  const fallback = options?.fallback ?? globalPreferenceFallback;
  const normalized = mergeWithDefaultValues(
    raw as Partial<GlobalPreferenceValues> | undefined,
    fallback
  );
  const { lines, text } = applyUpdates(metadata, preferencesToKeyValue(normalized));
  return { data: text, metadata: lines };
}

export function formatGlobalPreferenceValue(
  definition: PreferenceItem<any>,
  value: unknown
): string {
  if ('type' in definition) {
    if (definition.type === 'java.lang.Boolean') return value ? 'true' : 'false';
    if (definition.type === 'java.lang.Integer') return Number(value).toString();
  }
  return String(value ?? '');
}
