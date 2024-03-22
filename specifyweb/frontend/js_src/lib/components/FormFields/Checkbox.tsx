import React from 'react';

import { useResourceValue } from '../../hooks/useResourceValue';
import { parseBoolean } from '../../utils/parser/parse';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { userPreferences } from '../Preferences/userPreferences';

export function PrintOnSave({
  id,
  name,
  field,
  table,
  text,
  defaultValue,
}: {
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly field: LiteralField | Relationship | undefined;
  readonly table: SpecifyTable;
  readonly text: string | undefined;
  readonly defaultValue: boolean | undefined;
}): JSX.Element {
  const [tables, setTables] = userPreferences.use(
    'form',
    'preferences',
    'printOnSave'
  );
  /*
   * Need to check for object explicitly, because this cache key stored
   * boolean in the past
   */
  const entry = typeof tables === 'object' ? tables[table.name] : undefined;
  const handleChange = React.useCallback(
    (checked: boolean): void =>
      setTables({
        ...(typeof tables === 'object' ? tables : {}),
        [table.name]: checked,
      }),
    [setTables, tables, table.name]
  );
  React.useEffect(() => {
    if (entry === undefined && typeof defaultValue === 'boolean')
      handleChange(defaultValue);
  }, [defaultValue, entry, handleChange]);

  const input = (
    <Input.Checkbox
      checked={entry === true}
      id={id}
      name={name}
      onValueChange={handleChange}
    />
  );
  return typeof text === 'string' ? (
    <Label.Inline title={field?.getLocalizedDesc()}>
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
  name,
  field,
  defaultValue,
  text,
}: {
  readonly id: string | undefined;
  readonly name?: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly field: LiteralField | undefined;
  readonly defaultValue: boolean | undefined;
  readonly text: string | undefined;
}): JSX.Element {
  const {
    value = false,
    updateValue,
    validationRef,
  } = useResourceValue<boolean | string | null>(
    resource,
    field,
    React.useMemo(() => ({ value: defaultValue }), [defaultValue])
  );

  const isChecked = React.useMemo(
    () => (value === null ? false : parseBoolean(value?.toString())),
    [value]
  );

  const isReadOnly = React.useContext(ReadOnlyContext);
  const input = (
    <Input.Checkbox
      checked={isChecked}
      forwardRef={validationRef}
      id={id}
      isReadOnly={isReadOnly || field?.isReadOnly !== false}
      name={name}
      onValueChange={updateValue}
      // Checkbox cannot be required as checkbox does not have a "null" state
    />
  );
  return typeof text === 'string' ? (
    <Label.Inline title={field?.getLocalizedDesc()}>
      {input}
      {text}
    </Label.Inline>
  ) : (
    input
  );
}
