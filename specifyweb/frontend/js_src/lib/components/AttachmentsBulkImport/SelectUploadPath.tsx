import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { defined } from '../../utils/types';
import { Select } from '../Atoms/Form';
import { strictGetTable } from '../DataModel/tables';
import { syncFieldFormat } from '../Formatters/fieldFormat';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import type { PartialAttachmentUploadSpec } from './Import';
import { staticAttachmentImportPaths } from './importPaths';

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

  function handleChange(newValue: string): void {
    if (newValue === '' || newValue === undefined || newValue === staticKey)
      return;
    setStaticKey(newValue);
    handleCommit?.(generateUploadSpec(newValue));
  }

  return (
    <Select
      aria-label={attachmentsText.choosePath()}
      className="w-full min-w-[theme(spacing.40)]"
      disabled={handleCommit === undefined}
      value={staticKey ?? ''}
      onValueChange={handleChange}
    >
      <option disabled value="">
        {attachmentsText.choosePath()}
      </option>
      {Object.entries(staticAttachmentImportPaths).map(
        ([value, { path, baseTable }], index) => (
          <option key={index} value={value}>
            {`${strictGetTable(baseTable).label} / ${
              defined(strictGetTable(baseTable).getField(path)).label
            }`}
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
    value === undefined || value === null || field?.isRelationship === true
      ? undefined
      : syncFieldFormat(
          field,
          value.toString(),
          queryFieldSpec.parser,
          undefined,
          true
        );
  return {
    staticPathKey,
    formatQueryResults: queryResultsFormatter,
    fieldFormatter:
      field?.isRelationship === true ? undefined : field?.getUiFormatter(),
  };
}
