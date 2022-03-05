import { agentTypes } from './picklists';
import type { LiteralField } from './specifyfield';

export function fieldFormat(
  field: LiteralField,
  value: string | undefined
): string {
  const formatted =
    typeof value === 'string'
      ? field.getUiFormatter()?.format(value.toString()) ?? value.toString()
      : '';

  // TODO: format items in all pick lists
  if (field.name === 'agentType' && field.model.name === 'Agent')
    return agentTypes[asInt] ?? '';
  else if (field.type in byType) return byType[field.type](formatted);
  else return formatted;
}
