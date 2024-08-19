import React from 'react';

import { useResourceValue } from '../../hooks/useResourceValue';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import { getValidationAttributes } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Select } from '../Atoms/Form';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceApiUrl } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import type { PickList } from '../DataModel/types';
import type {
  DefaultComboBoxProps,
  PickListItemSimple,
} from '../FormFields/ComboBox';
import { AutoComplete } from '../Molecules/AutoComplete';
import { Dialog } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
import { PickListTypes } from './definitions';

export function PickListComboBox({
  id,
  resource,
  field,
  pickListName,
  defaultValue: rawDefaultValue,
  isRequired: rawIsRequired,
  isDisabled,
  items: rawItems,
  pickList,
  onAdd: rawHandleAdd,
}: DefaultComboBoxProps & {
  readonly items: RA<PickListItemSimple>;
  // This may be undefined for front-end only picklists
  readonly pickList: SpecifyResource<PickList> | undefined;
  // Pick list is considered read only if onAdd is undefined
  readonly onAdd?: (value: string) => void;
}): JSX.Element {
  const relatedTable = field.isRelationship
    ? field.relatedTable.name
    : undefined;
  const items = React.useMemo(
    () =>
      typeof relatedTable === 'string'
        ? rawItems.map((item) =>
            typeof f.parseInt(item.value) === 'number'
              ? {
                  ...item,
                  value: getResourceApiUrl(relatedTable, item.value),
                }
              : item
          )
        : rawItems,
    [rawItems, relatedTable]
  );

  // Set default value
  const defaultValue = React.useMemo(() => {
    const defaultItem =
      items.find(({ value }) => value === rawDefaultValue) ??
      items.find(({ title }) => title === rawDefaultValue);
    if (defaultItem !== undefined && typeof defaultItem !== 'object')
      console.warn(
        'default value for picklist is not a member of the picklist',
        { items }
      );
    return defaultItem?.value ?? rawDefaultValue;
  }, [rawDefaultValue, items]);

  const {
    value: rawValue,
    updateValue: rawUpdateValue,
    validationRef,
    parser,
  } = useResourceValue(
    resource,
    field,
    React.useMemo(
      () => ({
        value: defaultValue,
        required: rawIsRequired,
        type: 'text',
      }),
      [defaultValue, rawIsRequired]
    )
  );
  const value = React.useMemo(
    () =>
      typeof rawValue === 'object'
        ? (rawValue as unknown as SpecifyResource<AnySchema>)?.url() ?? null
        : (rawValue as number | string | undefined)?.toString() ?? null,
    [rawValue]
  );

  const updateValue = React.useCallback(
    (value: string): void =>
      rawUpdateValue(
        value === '' && parser.required !== true
          ? null
          : parser?.type === 'number'
          ? f.parseInt(value) ?? null
          : value
      ),
    [rawUpdateValue, parser]
  );

  // Warn on duplicates
  React.useEffect(() => {
    const values = items.map(({ value }) => value) ?? [];
    if (values.length !== new Set(values).size)
      console.error('Duplicate picklist entries found', { items, resource });
  }, [items, resource]);

  const [pendingNewValue, setPendingNewValue] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(
    () =>
      typeof pendingNewValue === 'string' &&
      items.some(({ value }) => value === pendingNewValue)
        ? updateValue(pendingNewValue)
        : undefined,
    [items, pendingNewValue, updateValue]
  );

  function addNewValue(value: string): void {
    if (pickList?.get('type') === PickListTypes.FIELDS) updateValue(value);
    else if (pickList?.get('type') === PickListTypes.ITEMS)
      setPendingNewValue(value);
    else throw new Error('Adding item to wrong type of picklist');
  }

  const currentValue = items.find((item) => item.value === value);
  const isExistingValue = typeof currentValue === 'object';

  const autocompleteItems = React.useMemo(
    () =>
      items
        .filter(({ value }) => Boolean(value))
        .map((item) => ({
          label: item.title,
          data: item.value,
        })),
    [items]
  );

  const handleAdd = hasToolPermission('pickLists', 'create')
    ? rawHandleAdd
    : undefined;

  const name = pickList?.get('name') ?? pickListName;

  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <>
      {pickList?.get('readOnly') === true || isDisabled ? (
        <Select
          id={id}
          // "null" value is represented as an empty string
          value={value ?? ''}
          {...getValidationAttributes(parser)}
          disabled={isDisabled || isReadOnly}
          forwardRef={validationRef}
          name={name}
          onValueChange={(newValue): void =>
            newValue === ''
              ? updateValue('')
              : items.some(({ value }) => value === newValue)
              ? updateValue(newValue)
              : undefined
          }
        >
          {isExistingValue ? (
            parser.required === true ? undefined : (
              <option key="nullValue" />
            )
          ) : value === null || value.length === 0 ? (
            <option key="nullValue" />
          ) : (
            <option key="invalidValue">
              {queryText.invalidPicklistValue({ value })}
            </option>
          )}
          {items.map(({ title, value }) => (
            // If pick list has duplicate values, this triggers React warnings
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </Select>
      ) : (
        <AutoComplete<string>
          aria-label={undefined}
          disabled={isDisabled || isReadOnly}
          filterItems
          forwardRef={validationRef}
          inputProps={{
            id,
            name,
            required: parser.required,
          }}
          source={autocompleteItems}
          value={(currentValue?.title || value) ?? ''}
          onChange={({ data }): void => updateValue(data)}
          onCleared={(): void => updateValue('')}
          onNewValue={addNewValue}
        />
      )}
      {typeof pendingNewValue === 'string' &&
        typeof pickList === 'object' &&
        typeof handleAdd === 'function' && (
          <AddingToPicklist
            pickList={pickList}
            type={parser.type ?? 'string'}
            value={pendingNewValue}
            onAdd={(): void => {
              handleAdd?.(pendingNewValue);
              updateValue(pendingNewValue);
            }}
            onClose={(): void => setPendingNewValue(undefined)}
          />
        )}
    </>
  );
}

function AddingToPicklist({
  type,
  value,
  pickList,
  onAdd: handleAdd,
  onClose: handleClose,
}: {
  readonly type: string;
  readonly value: string;
  readonly pickList: SpecifyResource<PickList>;
  readonly onAdd: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const isInvalidNumeric = type === 'number' && f.parseInt(value) === undefined;
  return isInvalidNumeric ? (
    <Dialog
      buttons={commonText.close()}
      header={formsText.invalidType()}
      onClose={handleClose}
    >
      {formsText.invalidNumericPicklistValue({
        pickListTable: tables.PickList.label,
      })}
    </Dialog>
  ) : (
    <Dialog
      buttons={
        <>
          <Button.Success
            onClick={(): void =>
              loading(
                pickList
                  .rgetCollection('pickListItems')
                  .then(async (items) => {
                    const item = new tables.PickListItem.Resource();
                    item.set('title', value);
                    item.set('value', value);
                    items.add(item);
                    return pickList.save();
                  })
                  .then(handleClose)
                  .then(handleAdd)
              )
            }
          >
            {commonText.add()}
          </Button.Success>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
        </>
      }
      header={formsText.addToPickListConfirmation({
        pickListTable: tables.PickList.label,
      })}
      onClose={handleClose}
    >
      {formsText.addToPickListConfirmationDescription({
        pickListTable: tables.PickList.label,
        value,
        pickListName: pickList.get('name'),
      })}
    </Dialog>
  );
}
