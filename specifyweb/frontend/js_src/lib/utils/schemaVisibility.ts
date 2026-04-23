export function isSchemaFieldVisible(
  showHiddenFields: boolean,
  isHidden: boolean,
  fieldName: string,
  defaultFieldName?: string
): boolean {
  return showHiddenFields || !isHidden || fieldName === defaultFieldName;
}