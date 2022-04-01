import type { SpecifyModel } from './specifymodel';

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
  text: string;
  title: string | undefined;
} {
  // The label was hard coded in the form
  if (typeof text === 'string' && text.length > 0)
    return {
      text,
      title: undefined,
    };

  const field = model.getField(fieldName ?? '');

  return {
    text: field?.label ?? fieldName ?? id ?? '',
    title: field?.getLocalizedDesc() ?? '',
  };
}
