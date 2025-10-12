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
  general: {
    auditing: {
      enableAuditLog: true,
      logFieldLevelChanges: true,
    },
    formatting: {
      fullDateFormat: 'YYYY-MM-DD',
      monthYearDateFormat: 'YYYY-MM',
    },
    attachments: {
      attachmentThumbnailSize: 256,
    },
  },
};

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

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== 'string') return fallback;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return fallback;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (typeof value !== 'string') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function preferencesFromMap(map: Record<string, string>): GlobalPreferenceValues {
  const fullDateFormat = normalizeFormat(
    map[PREFERENCE_KEYS.fullDateFormat] ?? DEFAULT_VALUES.general.formatting.fullDateFormat
  );
  const monthYearFormat = normalizeFormat(
    map[PREFERENCE_KEYS.monthYearDateFormat] ?? DEFAULT_VALUES.general.formatting.monthYearDateFormat
  );

  return {
    general: {
      auditing: {
        enableAuditLog: parseBoolean(
          map[PREFERENCE_KEYS.enableAuditLog],
          DEFAULT_VALUES.general.auditing.enableAuditLog
        ),
        logFieldLevelChanges: parseBoolean(
          map[PREFERENCE_KEYS.logFieldLevelChanges],
          DEFAULT_VALUES.general.auditing.logFieldLevelChanges
        ),
      },
      formatting: {
        fullDateFormat,
        monthYearDateFormat: MONTH_YEAR_FORMAT_OPTIONS.includes(
          monthYearFormat as (typeof MONTH_YEAR_FORMAT_OPTIONS)[number]
        )
          ? (monthYearFormat as (typeof MONTH_YEAR_FORMAT_OPTIONS)[number])
          : DEFAULT_VALUES.general.formatting.monthYearDateFormat,
      },
      attachments: {
        attachmentThumbnailSize: parseNumber(
          map[PREFERENCE_KEYS.attachmentThumbnailSize],
          DEFAULT_VALUES.general.attachments.attachmentThumbnailSize
        ),
      },
    },
  };
}

export function parseGlobalPreferences(
  data: string | null
): { readonly raw: GlobalPreferenceValues; readonly metadata: ReadonlyArray<PropertyLine> } {
  const parsed = parseProperties(data ?? '');
  const values = preferencesFromMap(parsed.map);
  return { raw: values, metadata: parsed.lines };
}

function normalizeValues(
  values: GlobalPreferenceValues | Partial<GlobalPreferenceValues> | undefined
): GlobalPreferenceValues {
  const merged = values ?? DEFAULT_VALUES;
  return {
    general: {
      auditing: {
        enableAuditLog:
          merged.general?.auditing?.enableAuditLog ?? DEFAULT_VALUES.general.auditing.enableAuditLog,
        logFieldLevelChanges:
          merged.general?.auditing?.logFieldLevelChanges ??
          DEFAULT_VALUES.general.auditing.logFieldLevelChanges,
      },
      formatting: {
        fullDateFormat:
          merged.general?.formatting?.fullDateFormat ??
          DEFAULT_VALUES.general.formatting.fullDateFormat,
        monthYearDateFormat:
          merged.general?.formatting?.monthYearDateFormat ??
          DEFAULT_VALUES.general.formatting.monthYearDateFormat,
      },
      attachments: {
        attachmentThumbnailSize:
          merged.general?.attachments?.attachmentThumbnailSize ??
          DEFAULT_VALUES.general.attachments.attachmentThumbnailSize,
      },
    },
  };
}

function preferencesToKeyValue(values: GlobalPreferenceValues): Record<string, string> {
  return {
    [PREFERENCE_KEYS.enableAuditLog]: values.general.auditing.enableAuditLog ? 'true' : 'false',
    [PREFERENCE_KEYS.logFieldLevelChanges]: values.general.auditing.logFieldLevelChanges
      ? 'true'
      : 'false',
    [PREFERENCE_KEYS.fullDateFormat]: normalizeFormat(values.general.formatting.fullDateFormat),
    [PREFERENCE_KEYS.monthYearDateFormat]: normalizeFormat(
      values.general.formatting.monthYearDateFormat
    ),
    [PREFERENCE_KEYS.attachmentThumbnailSize]: values.general.attachments.attachmentThumbnailSize.toString(),
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
  metadata: ReadonlyArray<PropertyLine>
): { readonly data: string; readonly metadata: ReadonlyArray<PropertyLine> } {
  const normalized = normalizeValues(raw as GlobalPreferenceValues | undefined);
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