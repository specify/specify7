import React from 'react';

import type { PickList } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { queryText } from '../localization/query';
import { hasToolPermission } from '../permissions';
import { PickListTypes } from '../picklistmixins';
import { resourceOn } from '../resource';
import { schema } from '../schema';
import type { RA } from '../types';
import { Autocomplete } from './autocomplete';
import { Button, Input, Select } from './basic';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { LoadingContext } from './contexts';
import { useValidation } from './hooks';
import { Dialog } from './modaldialog';
import { useSaveBlockers, useValidationAttributes } from './resource';

export function PickListComboBox(
  props: DefaultComboBoxProps & {
    readonly items: RA<PickListItemSimple> | undefined;
    // This may be undefined for front-end only picklists
    readonly pickList: SpecifyResource<PickList> | undefined;
    // Pick list is considered read only if onAdd is undefined
    readonly onAdd?: (value: string) => void;
  }
): JSX.Element {
  const getValue = React.useCallback(() => {
    const value = props.resource.get(props.field.name);
    return typeof value === 'object'
      ? (value as SpecifyResource<AnySchema>)?.url() ?? null
      : (value as string | number)?.toString() ?? null;
  }, [props.resource, props.field?.name]);

  const [value, setValue] = React.useState<string | null>(getValue);

  const validationAttributes = useValidationAttributes(props.field);
  const updateValue = React.useCallback(
    (value: string): void =>
      void props.resource.set(
        props.field.name,
        (value === '' && !props.isRequired
          ? null
          : validationAttributes.type === 'number'
          ? f.parseInt(value) ?? null
          : value) as never
      ),
    [props.field.name, validationAttributes, props.isRequired, props.resource]
  );

  // Listen for changes to the field
  React.useEffect(() => {
    void props.resource.businessRuleMgr?.checkField(props.field.name);
    return resourceOn(props.resource, `change:${props.field.name}`, (): void =>
      setValue(getValue)
    );
  }, [props.resource, props.field.name, getValue]);

  // Set default value
  React.useEffect(() => {
    if (
      props.resource.isNew() &&
      typeof props.defaultValue === 'string' &&
      Array.isArray(props.items)
    ) {
      const defaultItem =
        props.items.find(({ value }) => value === props.defaultValue) ??
        props.items.find(({ title }) => title === props.defaultValue);
      if (typeof defaultItem === 'object') updateValue(defaultItem.value);
      else
        console.warn(
          'default value for picklist is not a member of the picklist',
          [props.items, props.resource, props.defaultValue]
        );
    }
  }, [props.items, props.resource, props.defaultValue, updateValue]);

  // Warn on duplicates
  React.useEffect(() => {
    const values = props.items?.map(({ value }) => value) ?? [];
    if (values.length !== new Set(values).size)
      console.error('Duplicate picklist entries found', [
        props.items,
        props.resource,
      ]);
  }, [props.items, props.resource]);

  const errors = useSaveBlockers({
    resource: props.model,
    fieldName: props.field.name,
  });
  const isRemote = props.resource !== props.model;
  const { validationRef } = useValidation(isRemote ? '' : errors);

  const [pendingNewValue, setPendingNewValue] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(() => {
    if (
      typeof pendingNewValue === 'string' &&
      props.items?.some(({ value }) => value === pendingNewValue) === true
    )
      updateValue(pendingNewValue);
  }, [props.items, pendingNewValue, updateValue]);

  function addNewValue(value: string): void {
    if (props.pickList?.get('type') === PickListTypes.FIELDS)
      updateValue(value);
    else if (props.pickList?.get('type') === PickListTypes.ITEMS)
      setPendingNewValue(value);
    else throw new Error('adding item to wrong type of picklist');
  }

  const currentValue = props.items?.find((item) => item.value === value);
  const isExistingValue =
    typeof props.items === 'undefined' || typeof currentValue === 'object';

  const autocompleteItems = React.useMemo(
    () =>
      props.items
        ?.filter(({ value }) => Boolean(value))
        .map((item) => ({
          label: item.title,
          data: item.value,
        })) ?? [],
    [props.items]
  );

  const handleAdd = hasToolPermission('pickLists', 'create')
    ? props.onAdd
    : undefined;

  const isDisabled = props.isDisabled || typeof props.items === 'undefined';

  return (
    <>
      {typeof handleAdd === 'undefined' || isDisabled ? (
        <Select
          id={props.id}
          // "null" value is represented as an empty string
          value={value ?? ''}
          {...validationAttributes}
          required={
            ('required' in validationAttributes || props.isRequired) &&
            props.mode !== 'search'
          }
          onValueChange={(newValue): void =>
            props.items?.some(({ value }) => value === newValue) === true
              ? updateValue(newValue)
              : undefined
          }
          disabled={isDisabled}
        >
          {isExistingValue ? undefined : value === null ? (
            <option key="nullValue" />
          ) : (
            <option key="invalidValue">
              {queryText('invalidPicklistValue')(value)}
            </option>
          )}
          {props.items?.map(({ title, value }) => (
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </Select>
      ) : (
        <Autocomplete<string>
          filterItems={true}
          source={autocompleteItems}
          onNewValue={addNewValue}
          onChange={({ data }): void => updateValue(data)}
          onCleared={(): void => updateValue('')}
          forwardRef={validationRef}
          aria-label={undefined}
          value={(currentValue?.title || value) ?? ''}
        >
          {(inputProps): JSX.Element => (
            <Input.Generic
              id={props.id}
              name={props.pickList?.get('name') ?? props.pickListName}
              disabled={props.isDisabled || typeof props.items === 'undefined'}
              isReadOnly={props.mode === 'view'}
              required={
                ('required' in validationAttributes || props.isRequired) &&
                props.mode !== 'search'
              }
              {...inputProps}
            />
          )}
        </Autocomplete>
      )}
      {typeof pendingNewValue === 'string' &&
        typeof props.pickList === 'object' &&
        typeof handleAdd === 'function' && (
          <AddingToPicklist
            value={pendingNewValue}
            pickList={props.pickList}
            onAdd={(): void => handleAdd?.(pendingNewValue)}
            onClose={(): void => setPendingNewValue(undefined)}
          />
        )}
    </>
  );
}

function AddingToPicklist({
  value,
  pickList,
  onAdd: handleAdd,
  onClose: handleClose,
}: {
  readonly value: string;
  readonly pickList: SpecifyResource<PickList>;
  readonly onAdd: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  return (
    <Dialog
      title={formsText('addToPickListConfirmationDialogTitle')}
      header={formsText('addToPickListConfirmationDialogHeader')}
      onClose={handleClose}
      buttons={
        <>
          <Button.Green
            onClick={(): void =>
              loading(
                pickList
                  .rgetCollection('pickListItems')
                  .then(async (items) => {
                    const item = new schema.models.PickListItem.Resource();
                    item.set('title', value);
                    item.set('value', value);
                    items.add(item);
                    return pickList.save();
                  })
                  .then(handleAdd)
              )
            }
          >
            {commonText('add')}
          </Button.Green>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
        </>
      }
    >
      {formsText('addToPickListConfirmationDialogMessage')(
        value,
        pickList.get('name')
      )}
    </Dialog>
  );
}
