import { fullDateFormat } from './dateformat';
import { dayjs } from './dayjs';
import { agentTypes } from './picklists';
import type { LiteralField } from './specifyfield';
import type { IR } from './types';

function formatDate(value: string | undefined): string {
  if (!Boolean(value)) return '';
  const moment = dayjs(value);
  return moment.isValid() ? moment.format(fullDateFormat()) : value || '';
}

function formatInt(value: string | undefined): string {
  return value ?? '';
}

const byType: IR<(value: string | undefined) => string> = {
  'java.lang.Boolean': (value) =>
    value === null ? '' : Boolean(value) ? 'True' : 'False',
  'java.lang.Integer': formatInt,
  'java.sql.Timestamp': formatDate,
  'java.util.Calendar': formatDate,
  'java.util.Date': formatDate,
};

export function fieldFormat(
  field: LiteralField,
  value: string | undefined
): string {
  const asInt = Number.parseInt(value ?? '');
  if (field.getFormat() === 'CatalogNumberNumeric')
    return Number.isNaN(asInt) ? value ?? '' : asInt.toString();

  // TODO: format items in all pick lists
  if (field.name === 'agentType' && field.model.name === 'Agent')
    return agentTypes[asInt] ?? '';

  if (field.type in byType) return byType[field.type](value);

  return value ?? '';
}
