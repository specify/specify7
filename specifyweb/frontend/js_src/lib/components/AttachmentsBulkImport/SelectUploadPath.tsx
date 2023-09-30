import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { syncFieldFormat } from '../../utils/fieldFormat';
import { defined } from '../../utils/types';
import { Select } from '../Atoms/Form';
import { strictGetModel } from '../DataModel/schema';
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
        ([value, { path, baseTable }], index) => (
          <option key={index} value={value}>
            {`${strictGetModel(baseTable).label} / ${
              defined(strictGetModel(baseTable).getField(path)).label
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
      : syncFieldFormat(field, queryFieldSpec.parser, value.toString(), true);
  return {
    staticPathKey,
    formatQueryResults: queryResultsFormatter,
    fieldFormatter: field?.getUiFormatter(),
  };
}
