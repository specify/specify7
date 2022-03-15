import * as React from 'react';

import type { PickList } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import queryText from '../localization/query';
import { schema } from '../schema';
import type { RA } from '../types';
import { Autocomplete } from './autocomplete';
import { Button, Input } from './basic';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListTypes } from './combobox';
import { crash } from './errorboundary';
import { useValidation } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';
import { useSaveBlockers, useValidationAttributes } from './resource';

export function PickListComboBox(
  props: Omit<DefaultComboBoxProps, 'readOnly'> & {
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
        value === '' && props.isRequired
          ? null
          : validationAttributes.type === 'number'
          ? Number.parseInt(value)
          : value
      ),
    [props.field.name, validationAttributes, props.isRequired, props.resource]
  );

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

  // Listen for external changes to the field
  React.useEffect(() => {
    props.resource.on(`change:${props.field.name.toLowerCase()}`, () =>
      setValue(getValue())
    );
    void props.resource.businessRuleMgr.checkField(props.field.name);
  }, [props.resource, props.field.name, getValue]);

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
    model: props.model,
    fieldName: props.field.name,
  });
  const remote = props.resource !== props.model;
  const { validationRef } = useValidation(remote ? '' : errors);

  const [pendingNewValue, setPendingNewValue] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(() => {
    if (
      typeof pendingNewValue === 'string' &&
      props.items?.some(({ value }) => value === pendingNewValue)
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

  const [isLoading, setIsLoading] = React.useState(false);
  const isExistingValue =
    props.items?.some((item) => item.value === value) ?? true;

  const autocompleteItems = React.useMemo(
    () =>
      Object.fromEntries(
        props.items
          ?.filter(({ value }) => Boolean(value))
          .map(
            (item) =>
              [
                item.value,
                {
                  label: item.title,
                  data: undefined,
                },
              ] as const
          ) ?? []
      ),
    [props.items]
  );

  return (
    <>
      {isLoading && <LoadingScreen />}
      {typeof props.onAdd === 'undefined' ? (
        <select
          id={props.id}
          // "null" value is represented as an empty string
          value={value ?? ''}
          {...validationAttributes}
          required={props.isRequired}
          onChange={({ target }): void =>
            props.items?.some(({ value }) => value === target.value)
              ? updateValue(target.value)
              : undefined
          }
          disabled={props.isDisabled || typeof props.items === 'undefined'}
        >
          {isExistingValue ? undefined : value === null ? (
            props.isRequired ? undefined : (
              <option key="nullValue" />
            )
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
        </select>
      ) : (
        <Autocomplete<undefined>
          source={autocompleteItems}
          onNewValue={addNewValue}
          onChange={updateValue}
          renderSearchBox={(inputProps): JSX.Element => (
            <Input.Generic
              id={props.id}
              forwardRef={validationRef}
              name={props.pickList?.get('name') ?? props.pickListName}
              className={props.className}
              disabled={props.isDisabled || typeof props.items === 'undefined'}
              required={props.isRequired}
              {...validationAttributes}
              {...inputProps}
            />
          )}
        />
      )}
      {typeof pendingNewValue === 'string' &&
        typeof props.pickList === 'object' &&
        typeof props.onAdd === 'function' && (
          <AddingToPicklist
            value={pendingNewValue}
            pickList={props.pickList}
            onAdd={(): void => props.onAdd?.(pendingNewValue)}
            onClose={(): void => setPendingNewValue(undefined)}
            onLoading={setIsLoading}
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
  onLoading: handleLoading,
}: {
  readonly value: string;
  readonly pickList: SpecifyResource<PickList>;
  readonly onAdd: () => void;
  readonly onClose: () => void;
  readonly onLoading: (isLoading: boolean) => void;
}): JSX.Element {
  return (
    <Dialog
      title={formsText('addToPickListConfirmationDialogTitle')}
      header={formsText('addToPickListConfirmationDialogHeader')}
      onClose={handleClose}
      buttons={
        <>
          <Button.Green
            onClick={(): void => {
              handleLoading(true);
              pickList
                .rgetCollection('pickListItems')
                .then(async (items) => {
                  const item = new schema.models.PickListItem.Resource();
                  item.set('title', value);
                  item.set('value', value);
                  items.add(item);
                  return pickList.save();
                })
                .then(() => handleAdd())
                .then(() => handleLoading(false))
                .catch(crash);
            }}
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
