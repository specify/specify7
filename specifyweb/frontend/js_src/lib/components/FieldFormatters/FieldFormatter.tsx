import React from 'react';

import { formsText } from '../../localization/forms';
import { resourcesText } from '../../localization/resources';
import type { GetSet, RA } from '../../utils/types';
import { ErrorMessage } from '../Atoms';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { ResourcePreview } from '../Formatters/Preview';
import { hasTablePermission } from '../Permissions/helpers';
import type { UiFormatter } from '.';
import { resolveFieldFormatter } from '.';
import { FieldFormatterParts } from './Parts';
import type { FieldFormatter } from './spec';

export function FieldFormatterElement({
  item: [fieldFormatter, setFieldFormatter],
}: {
  readonly item: GetSet<FieldFormatter>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  // FIXME: add field selector
  return (
    <>
      <Label.Inline>
        {formsText.autoNumbering()}
        <Input.Checkbox
          checked={fieldFormatter.autoNumber !== undefined}
          isReadOnly={isReadOnly}
          required
          onValueChange={(autoNumber): void =>
            setFieldFormatter({ ...fieldFormatter, autoNumber })
          }
        />
      </Label.Inline>
      {fieldFormatter.external === undefined &&
      typeof fieldFormatter.table === 'object' ? (
        <FieldFormatterParts
          fieldFormatter={[fieldFormatter, setFieldFormatter]}
          table={fieldFormatter.table}
        />
      ) : (
        <ErrorMessage>{resourcesText.editorNotAvailable()}</ErrorMessage>
      )}
      <FieldFormatterPreview fieldFormatter={fieldFormatter} />
    </>
  );
}

function FieldFormatterPreview({
  fieldFormatter,
}: {
  readonly fieldFormatter: FieldFormatter;
}): JSX.Element | null {
  const doFormatting = React.useCallback(
    (resources: RA<SpecifyResource<AnySchema>>) => {
      const resolvedFormatter = resolveFieldFormatter(fieldFormatter);
      return resources.map((resource) =>
        formatterToPreview(resource, fieldFormatter, resolvedFormatter)
      );
    },
    [fieldFormatter]
  );
  return typeof fieldFormatter.table === 'object' &&
    hasTablePermission(fieldFormatter.table.name, 'read') ? (
    <ResourcePreview doFormatting={doFormatting} table={fieldFormatter.table} />
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
