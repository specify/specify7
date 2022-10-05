import React from 'react';

import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { Input, Label } from '../Atoms/Form';
import { useResourceValue } from '../../hooks/useResourceValue';
import { f } from '../../utils/functools';
import { AnySchema } from '../DataModel/helperTypes';
import { usePref } from '../UserPreferences/usePref';

export function PrintOnSave({
  id,
  fieldName,
  model,
  text,
  defaultValue,
}: {
  readonly id: string | undefined;
  readonly fieldName: string | undefined;
  readonly model: SpecifyModel;
  readonly text: string | undefined;
  readonly defaultValue: boolean | undefined;
}): JSX.Element {
  const [tables, setTables] = usePref('form', 'preferences', 'printOnSave');
  /*
   * Need to check for object explicitly, because this cache key stored
   * boolean in the past
   */
  const entry = typeof tables === 'object' ? tables[model.name] : undefined;
  const checked =
    entry === true || (entry === undefined && defaultValue === true);
  const input = (
    <Input.Checkbox
      checked={checked}
      id={id}
      name={fieldName}
      onValueChange={(checked): void =>
        setTables({
          ...(typeof tables === 'object' ? tables : {}),
          [model.name]: checked,
        })
      }
    />
  );
  return typeof text === 'string' ? (
    <Label.Inline title={model.getField(fieldName ?? '')?.getLocalizedDesc()}>
      {input}
      {text}
    </Label.Inline>
  ) : (
    input
  );
}

export function SpecifyFormCheckbox({
  id,
  resource,
  fieldName,
  defaultValue,
  isReadOnly,
  text,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string;
  readonly defaultValue: boolean | undefined;
  readonly isReadOnly: boolean;
  readonly text: string | undefined;
}): JSX.Element {
  const {
    value = false,
    updateValue,
    validationRef,
  } = useResourceValue<boolean | string>(
    resource,
    fieldName,
    React.useMemo(() => ({ value: defaultValue }), [defaultValue])
  );
  const isChecked =
    !f.includes(falsyFields, value?.toString().toLowerCase().trim()) &&
    Boolean(value);
  const input = (
    <Input.Checkbox
      checked={isChecked}
      forwardRef={validationRef}
      id={id}
      isReadOnly={
        isReadOnly || resource.specifyModel.getField(fieldName)?.isReadOnly
      }
      name={fieldName}
      onValueChange={updateValue}
      // Checkbox cannot be required as checkbox does not have a "null" state
    />
  );
  return typeof text === 'string' ? (
    <Label.Inline
      title={resource.specifyModel
        .getField(fieldName ?? '')
        ?.getLocalizedDesc()}
    >
      {input}
      {text}
    </Label.Inline>
  ) : (
    input
  );
}

// REFACTOR: use UiParse boolan parser instead
const falsyFields = ['false', 'no', 'nan', 'null'];
