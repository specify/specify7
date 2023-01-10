import React from 'react';

import { useSaveBlockers, useValidationAttributes } from '../../hooks/resource';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Select } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceApiUrl, resourceOn } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type { PickList } from '../DataModel/types';
import type {
  DefaultComboBoxProps,
  PickListItemSimple,
} from '../FormFields/ComboBox';
import { AutoComplete } from '../Molecules/AutoComplete';
import { Dialog } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
import { PickListTypes } from './definitions';

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
      : (value as number | string)?.toString() ?? null;
  }, [props.resource, props.field?.name]);

  const relatedModel = props.field.isRelationship
    ? props.field.relatedModel.name
    : undefined;
  const items = React.useMemo(
    () =>
      typeof relatedModel === 'string'
        ? props.items?.map((item) =>
            typeof f.parseInt(item.value) === 'number'
              ? {
                  ...item,
                  value: getResourceApiUrl(relatedModel, item.value),
                }
              : item
          )
        : props.items,
    [props.items, relatedModel]
  );

  const [value, setValue] = React.useState<string | null>(getValue);

  const validationAttributes = useValidationAttributes(props.field);
  const updateValue = React.useCallback(
    (value: string): void =>
      void props.resource.set(
        props.field.name,
        (value === '' && !props.isRequired
          ? null
          : (validationAttributes?.type === 'number'
          ? f.parseInt(value) ?? null
          : value)) as never
      ),
    [props.field.name, validationAttributes, props.isRequired, props.resource]
  );

  // Listen for field value change
  React.useEffect(() => {
    void props.resource.businessRuleMgr?.checkField(props.field.name);
    return resourceOn(
      props.resource,
      `change:${props.field.name}`,
      (): void => setValue(getValue()),
      true
    );
  }, [props.resource, props.field.name, getValue]);

  // Set default value
  React.useEffect(() => {
    if (
      props.resource.isNew() &&
      typeof props.defaultValue === 'string' &&
      Array.isArray(items) &&
      !Boolean(props.resource.get(props.field.name))
    ) {
      const defaultItem =
        items.find(({ value }) => value === props.defaultValue) ??
        items.find(({ title }) => title === props.defaultValue);
      if (typeof defaultItem === 'object') updateValue(defaultItem.value);
      else
        console.warn(
          'default value for picklist is not a member of the picklist',
          [items, props.resource, props.defaultValue]
        );
    }
  }, [items, props.resource, props.defaultValue, updateValue]);

  // Warn on duplicates
  React.useEffect(() => {
    const values = items?.map(({ value }) => value) ?? [];
    if (values.length !== new Set(values).size)
      console.error('Duplicate picklist entries found', [
        items,
        props.resource,
      ]);
  }, [items, props.resource]);

  const errors = useSaveBlockers({
    resource: props.model,
    fieldName: props.field.name,
  });
  const isRemote = props.resource !== props.model;
  const { validationRef } = useValidation(isRemote ? '' : errors);

  const [pendingNewValue, setPendingNewValue] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(
    () =>
      typeof pendingNewValue === 'string' &&
      items?.some(({ value }) => value === pendingNewValue) === true
        ? updateValue(pendingNewValue)
        : undefined,
    [items, pendingNewValue, updateValue]
  );

  function addNewValue(value: string): void {
    if (props.pickList?.get('type') === PickListTypes.FIELDS)
      updateValue(value);
    else if (props.pickList?.get('type') === PickListTypes.ITEMS)
      setPendingNewValue(value);
    else throw new Error('Adding item to wrong type of picklist');
  }

  const currentValue = items?.find((item) => item.value === value);
  const isExistingValue =
    items === undefined || typeof currentValue === 'object';

  const autocompleteItems = React.useMemo(
    () =>
      items
        ?.filter(({ value }) => Boolean(value))
        .map((item) => ({
          label: item.title,
          data: item.value,
        })) ?? [],
    [items]
  );

  const handleAdd = hasToolPermission('pickLists', 'create')
    ? props.onAdd
    : undefined;

  const isDisabled = props.isDisabled || items === undefined;
  const isRequired =
    ('required' in validationAttributes || props.isRequired) &&
    props.mode !== 'search';
  const name = props.pickList?.get('name') ?? props.pickListName;

  const sizeLimit = props.pickList?.get('sizeLimit');
  const canAddNew =
    typeof props.onAdd === 'function' &&
    typeof sizeLimit === 'number' &&
    sizeLimit > 0 &&
    sizeLimit <= autocompleteItems.length;

  return (
    <>
      {props.pickList?.get('readOnly') === true || isDisabled ? (
        <Select
          id={props.id}
          // "null" value is represented as an empty string
          value={value ?? ''}
          {...validationAttributes}
          disabled={isDisabled || props.mode === 'view'}
          name={name}
          required={isRequired}
          onValueChange={(newValue): void =>
            newValue === ''
              ? updateValue('')
              : (items?.some(({ value }) => value === newValue) === true
              ? updateValue(newValue)
              : undefined)
          }
        >
          {isExistingValue ? (
            isRequired ? undefined : (
              <option key="nullValue" />
            )
          ) : (value === null ? (
            <option key="nullValue" />
          ) : (
            <option key="invalidValue">
              {queryText.invalidPicklistValue({ value })}
            </option>
          ))}
          {items?.map(({ title, value }) => (
            // If pick list has duplicate values, this triggers React warnings
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </Select>
      ) : (
        <AutoComplete<string>
          aria-label={undefined}
          disabled={isDisabled || props.mode === 'view'}
          filterItems
          forwardRef={validationRef}
          inputProps={{
            id: props.id,
            name,
            required: isRequired,
          }}
          source={autocompleteItems}
          value={(currentValue?.title || value) ?? ''}
          onChange={({ data }): void => updateValue(data)}
          onCleared={(): void => updateValue('')}
          onNewValue={canAddNew ? addNewValue : undefined}
        />
      )}
      {typeof pendingNewValue === 'string' &&
        typeof props.pickList === 'object' &&
        typeof handleAdd === 'function' && (
          <AddingToPicklist
            pickList={props.pickList}
            type={validationAttributes.type ?? 'string'}
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
      {formsText.invalidNumericPicklistValue()}
    </Dialog>
  ) : (
    <Dialog
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
                  .then(handleClose)
                  .then(handleAdd)
              )
            }
          >
            {commonText.add()}
          </Button.Green>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
        </>
      }
      header={formsText.addToPickListConfirmation()}
      onClose={handleClose}
    >
      {formsText.addToPickListConfirmationDescription({
        value,
        pickListName: pickList.get('name'),
      })}
    </Dialog>
  );
}
