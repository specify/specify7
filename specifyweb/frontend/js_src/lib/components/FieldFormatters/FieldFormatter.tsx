import React from 'react';

import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import {
  fieldFormatterToParser,
  getValidationAttributes,
} from '../../utils/parser/definitions';
import type { GetSet, RA } from '../../utils/types';
import { ErrorMessage } from '../Atoms';
import { Input, Label } from '../Atoms/Form';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField } from '../DataModel/specifyField';
import { softError } from '../Errors/assert';
import { ResourceMapping } from '../Formatters/Components';
import { ResourcePreview } from '../Formatters/Preview';
import { hasTablePermission } from '../Permissions/helpers';
import type { MappingLineData } from '../WbPlanView/navigator';
import type { UiFormatter } from '.';
import { resolveFieldFormatter } from '.';
import { FieldFormatterParts } from './Parts';
import type { FieldFormatter } from './spec';

export function FieldFormatterElement({
  item,
}: {
  readonly item: GetSet<FieldFormatter>;
}): JSX.Element {
  const [fieldFormatter] = item;
  return (
    <>
      <FieldPicker fieldFormatter={item} />
      {fieldFormatter.external === undefined &&
      typeof fieldFormatter.table === 'object' ? (
        <FieldFormatterParts fieldFormatter={item} />
      ) : (
        <ErrorMessage>{resourcesText.editorNotAvailable()}</ErrorMessage>
      )}
      <FieldFormatterPreview fieldFormatter={fieldFormatter} />
    </>
  );
}

function FieldPicker({
  fieldFormatter: [fieldFormatter, setFieldFormatter],
}: {
  readonly fieldFormatter: GetSet<FieldFormatter>;
}): JSX.Element | null {
  const openIndex = React.useState<number | undefined>(undefined);
  const mapping = React.useMemo(
    () => (fieldFormatter.field === undefined ? [] : [fieldFormatter.field]),
    [fieldFormatter.field]
  );
  return fieldFormatter.table === undefined ? null : (
    <Label.Block>
      {schemaText.field()}
      <ResourceMapping
        fieldFilter={excludeNonLiteral}
        isRequired
        mapping={[
          mapping,
          (mapping): void => {
            if (mapping !== undefined && mapping?.length > 1)
              softError('Expected mapping length to be no more than 1');
            const field = mapping?.[0];
            if (field?.isRelationship === true) {
              softError(
                'Did not expect relationship field in field formatter mapping'
              );
            } else {
              setFieldFormatter({ ...fieldFormatter, field });
            }
          },
        ]}
        openIndex={openIndex}
        table={fieldFormatter.table}
      />
    </Label.Block>
  );
}

const excludeNonLiteral = (mappingData: MappingLineData): MappingLineData => ({
  ...mappingData,
  fieldsData: Object.fromEntries(
    Object.entries(mappingData.fieldsData).filter(
      ([_name, fieldData]) => fieldData.tableName === undefined
    )
  ),
});

function FieldFormatterPreview({
  fieldFormatter,
}: {
  readonly fieldFormatter: FieldFormatter;
}): JSX.Element | null {
  const resolvedFormatter = React.useMemo(
    () => resolveFieldFormatter(fieldFormatter),
    [fieldFormatter]
  );
  const doFormatting = React.useCallback(
    (resources: RA<SpecifyResource<AnySchema>>) =>
      resources.map((resource) =>
        formatterToPreview(resource, fieldFormatter, resolvedFormatter)
      ),
    [fieldFormatter, resolvedFormatter]
  );
  return typeof fieldFormatter.table === 'object' &&
    hasTablePermission(fieldFormatter.table.name, 'read') ? (
    <>
      <FieldFormatterPreviewField
        field={fieldFormatter.field}
        resolvedFormatter={resolvedFormatter}
      />
      <ResourcePreview
        doFormatting={doFormatting}
        table={fieldFormatter.table}
      />
    </>
  ) : null;
}

function formatterToPreview(
  resource: SpecifyResource<AnySchema>,
  fieldFormatter: FieldFormatter,
  resolvedFormatter: UiFormatter | undefined
): string {
  if (resolvedFormatter === undefined)
    return resourcesText.formatterPreviewUnavailable();

  const field = fieldFormatter.field;
  if (field === undefined) return '';

  const value = String(resource.get(field.name) ?? '');
  if (value.length === 0) return resolvedFormatter.defaultValue;

  const formatted = resolvedFormatter.format(value);

  return formatted === undefined
    ? `${value} ${resourcesText.nonConformingInline()}`
    : formatted;
}

function FieldFormatterPreviewField({
  field,
  resolvedFormatter,
}: {
  readonly field: LiteralField | undefined;
  readonly resolvedFormatter: UiFormatter | undefined;
}): JSX.Element | null {
  const [value, setValue] = React.useState<string>('');
  const isConforming = React.useMemo(
    () => resolvedFormatter?.parse(value) !== undefined,
    [value, resolvedFormatter]
  );
  const parser = React.useMemo(
    () =>
      field === undefined || resolvedFormatter === undefined
        ? { type: 'text' as const }
        : fieldFormatterToParser(field, resolvedFormatter),
    [field, resolvedFormatter]
  );

  const validationAttributes = getValidationAttributes(parser);
  return resolvedFormatter === undefined ? null : (
    <Label.Block>
      {`${resourcesText.exampleField()} ${
        isConforming ? '' : resourcesText.nonConformingInline()
      }`}
      <Input.Generic
        type="text"
        value={value}
        onValueChange={setValue}
        {...validationAttributes}
        required={false}
      />
    </Label.Block>
  );
}
