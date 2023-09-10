import { staticAttachmentImportPaths } from './importPaths';
import React from 'react';
import { Select } from '../Atoms/Form';
import { attachmentsText } from '../../localization/attachments';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { syncFieldFormat } from '../../utils/fieldFormat';
import { PartialAttachmentUploadSpec } from './Import';

export function SelectUploadPath({
  onCommit: handleCommit,
  currentKey,
}: {
  readonly onCommit:
    | ((commitableSpec: PartialAttachmentUploadSpec) => void)
    | undefined;
  readonly currentKey: keyof typeof staticAttachmentImportPaths | undefined;
}): JSX.Element {
  const [staticKey, setStaticKey] = React.useState<
    keyof typeof staticAttachmentImportPaths | undefined
  >(currentKey);
  function handleBlur(): void {
    if (staticKey === currentKey || staticKey === undefined || staticKey === '')
      return;
    handleCommit?.(generateUploadSpec(staticKey));
  }
  return (
    <Select
      className="w-full"
      disabled={handleCommit === undefined}
      value={staticKey}
      onBlur={handleBlur}
      onValueChange={setStaticKey}
    >
      <option value="">{attachmentsText.choosePath()}</option>
      {Object.entries(staticAttachmentImportPaths).map(
        ([value, { label }], index) => (
          <option key={index} value={value}>
            {label}
          </option>
        )
      )}
    </Select>
  );
}

export function generateUploadSpec(
  staticPathKey: keyof typeof staticAttachmentImportPaths | undefined
): PartialAttachmentUploadSpec {
  if (staticPathKey === undefined) return { staticPathKey };
  const { baseTable, path } = staticAttachmentImportPaths[staticPathKey];
  const queryFieldSpec = QueryFieldSpec.fromPath(baseTable, path.split('.'));
  const field = queryFieldSpec.getField();
  const queryResultsFormatter = (
    value: number | string | null | undefined
  ): string | undefined =>
    value === undefined || value === null || field?.isRelationship
      ? undefined
      : syncFieldFormat(field, queryFieldSpec.parser, value.toString(), true);
  return {
    staticPathKey,
    formatQueryResults: queryResultsFormatter,
    fieldFormatter: field?.getUiFormatter(),
    mappingPath: queryFieldSpec.toMappingPath(),
  };
}
