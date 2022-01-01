import AgentTypeCBX from './agenttypecbx';
import dateFormat from './dateformat';
import dayjs from './dayjs';
import type { IR } from './types';

function formatDate(value: string | undefined): string {
  if (!value) return '';
  const m = dayjs(value);
  return m.isValid() ? m.format(dateFormat()) : value || '';
}

function formatInt(value: string | undefined): string {
  return value ?? '';
}

const byType: IR<(value: string | undefined) => string> = {
  'java.lang.Boolean': (value) =>
    value === null ? '' : value ? 'True' : 'False',
  'java.lang.Integer': formatInt,
  'java.sql.Timestamp': formatDate,
  'java.util.Calendar': formatDate,
  'java.util.Date': formatDate,
};

export default function (
  field: {
    readonly name: string;
    readonly model: {
      readonly name: string;
    };
    readonly type: string;
    readonly getFormat: () => string;
  },
  value: string | undefined
) {
  const asInt = Number.parseInt(value ?? '');
  if (field.getFormat() === 'CatalogNumberNumeric')
    return Number.isNaN(asInt) ? value : asInt;

  if (field.name === 'agentType' && field.model.name === 'Agent') {
    const agentType = AgentTypeCBX.prototype.getAgentTypes()[asInt];
    return agentType == null ? '' : agentType;
  }

  if (field.type in byType) return byType[field.type](value);

  return value ?? '';
}
