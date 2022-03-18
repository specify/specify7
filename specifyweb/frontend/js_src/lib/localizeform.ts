import type { SpecifyModel } from './specifymodel';
import * as stringLocalization from './stringlocalization';

const localize = (key: string): string =>
  stringLocalization.localizeFrom(['views', 'global_views'], key);

export function localizeLabel({
  text,
  id,
  model,
  fieldName,
}: {
  readonly text: string | undefined;
  readonly id: string | undefined;
  readonly model: SpecifyModel;
  readonly fieldName: string | undefined;
}): {
  children: string;
  title: string | undefined;
} {
  // The label was hard coded in the form
  if (typeof text === 'string' && text.length > 0)
    return {
      children: text,
      title: undefined,
    };

  const field = model.getField(fieldName ?? '');

  return model.name === 'Accession' &&
    (id === 'divLabel' || field?.name === 'divisionCBX')
    ? {
        children: localize('Division'),
        title: undefined,
      }
    : {
        children: field?.label ?? fieldName ?? id ?? '',
        title: field?.getLocalizedDesc() ?? '',
      };
}
