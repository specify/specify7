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
import type { DefaultComboBoxProps, PickListItemSimple} from '../FormFields/ComboBox';
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
  isRequired: isFieldRequired,
  isDisabled: isFieldDisabled,
  items: rawPicklistItems,
  pickList,
  onAdd: handleAddFromCaller,
}: DefaultComboBoxProps & {
  readonly items: RA<PickListItemSimple>;
  readonly pickList: SpecifyResource<PickList> | undefined;
  readonly onAdd?: (value: string) => void;
}): JSX.Element {
  const relatedTableName =
    field.isRelationship ? field.relatedTable.name : undefined;

  const normalizedItems = React.useMemo(
    () =>
      typeof relatedTableName === 'string'
        ? rawPicklistItems.map((item) =>
            typeof f.parseInt(item.value) === 'number'
              ? {
                  ...item,
                  value: getResourceApiUrl(relatedTableName, item.value),
                }
              : item
          )
        : rawPicklistItems,
    [rawPicklistItems, relatedTableName]
  );

  const normalizedDefaultValue = React.useMemo(() => {
    const matchedDefaultItem =
      normalizedItems.find(({ value }) => value === rawDefaultValue) ??
      normalizedItems.find(({ title }) => title === rawDefaultValue);

    if (matchedDefaultItem !== undefined && typeof matchedDefaultItem !== 'object') {
      console.warn('Default value for picklist is not a member of the picklist', {
        normalizedItems,
      });
    }
    return matchedDefaultItem?.value ?? rawDefaultValue;
  }, [rawDefaultValue, normalizedItems]);

  const {
    value: currentRawModelValue,
    updateValue: updateModelValue,
    validationRef,
    parser,
  } = useResourceValue(
    resource,
    field,
    React.useMemo(
      () => ({
        value: normalizedDefaultValue,
        required: isFieldRequired,
        type: 'text',
      }),
      [normalizedDefaultValue, isFieldRequired]
    )
  );

  const currentValueAsString = React.useMemo(
    () =>
      typeof currentRawModelValue === 'object'
        ? ((currentRawModelValue as unknown as SpecifyResource<AnySchema>)?.url() ??
            null)
        : ((currentRawModelValue as number | string | undefined)?.toString() ??
            null),
    [currentRawModelValue]
  );

  const writeModelValue = React.useCallback(
    (newValueString: string): void =>
      updateModelValue(
        newValueString === '' && parser.required !== true
          ? null
          : parser?.type === 'number'
            ? (f.parseInt(newValueString) ?? null)
            : newValueString
      ),
    [updateModelValue, parser]
  );

  React.useEffect(() => {
    const itemValues = normalizedItems.map(({ value }) => value) ?? [];
    if (itemValues.length !== new Set(itemValues).size) {
      console.error('Duplicate picklist entries found', {
        normalizedItems,
        resource,
      });
    }
  }, [normalizedItems, resource]);

  const [pendingNewValue, setPendingNewValue] = React.useState<
    string | undefined
  >(undefined);

  // If a pending new value appears in items (after it’s added), write it to the model
  React.useEffect(
    () =>
      typeof pendingNewValue === 'string' &&
      normalizedItems.some(({ value }) => value === pendingNewValue)
        ? writeModelValue(pendingNewValue)
        : undefined,
    [normalizedItems, pendingNewValue, writeModelValue]
  );

  function handleRequestAddNewValue(typedValue: string): void {
    if (pickList?.get('type') === PickListTypes.FIELDS) {
      writeModelValue(typedValue);
    } else if (pickList?.get('type') === PickListTypes.ITEMS) {
      setPendingNewValue(typedValue);
    } else {
      throw new Error('Adding item to wrong type of picklist');
    }
  }

  const matchedCurrentItem = normalizedItems.find(
    (item) => item.value === currentValueAsString
  );
  const isCurrentValueInList = typeof matchedCurrentItem === 'object';

  const autoCompleteSourceItems = React.useMemo(
    () =>
      normalizedItems
        .filter(({ value }) => Boolean(value))
        .map((item) => ({
          label: item.title,
          data: item.value,
        })),
    [normalizedItems]
  );

  const canAddToPicklist = hasToolPermission('pickLists', 'create')
    ? handleAddFromCaller
    : undefined;

  const fieldNameForForm = pickList?.get('name') ?? pickListName;
  const isReadOnly = React.useContext(ReadOnlyContext);

  const isRankOrTreeLevelPickList = React.useMemo(() => {
    const identifierText = [pickList?.get?.('name'), pickListName, (field as any)?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return /(rank|taxon.*level|geo.*level|_treelevelcombobox)/i.test(identifierText);
  }, [pickList, pickListName, field]);

  return (
    <>
      {isRankOrTreeLevelPickList ? (
        <Select
          id={id}
          value={currentValueAsString ?? ''}
          {...getValidationAttributes(parser)}
          disabled={isFieldDisabled || isReadOnly}
          forwardRef={validationRef}
          name={fieldNameForForm}
          onValueChange={(newSelectedValue): void =>
            newSelectedValue === ''
              ? writeModelValue('')
              : normalizedItems.some(({ value }) => value === newSelectedValue)
                ? writeModelValue(newSelectedValue)
                : undefined
          }
        >
          {isCurrentValueInList ? (
            parser.required === true ? undefined : <option key="nullValue" />
          ) : currentValueAsString === null || currentValueAsString.length === 0 ? (
            <option key="nullValue" />
          ) : (
            <option key="invalidValue">
              {queryText.invalidPicklistValue({ value: currentValueAsString })}
            </option>
          )}
          {normalizedItems.map(({ title, value }) => (
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </Select>
      ) : (
        <AutoComplete<string>
          aria-label={undefined}
          disabled={isFieldDisabled || isReadOnly}
          filterItems
          forwardRef={validationRef}
          inputProps={{
            id,
            name: fieldNameForForm,
            required: parser.required,
          }}
          source={autoCompleteSourceItems}
          value={(matchedCurrentItem?.title || currentValueAsString) ?? ''}
          onChange={({ data }): void => writeModelValue(data)}
          onCleared={(): void => writeModelValue('')}
          onNewValue={canAddToPicklist ? handleRequestAddNewValue : undefined}
        />
      )}

      {typeof pendingNewValue === 'string' &&
        typeof pickList === 'object' &&
        typeof canAddToPicklist === 'function' && (
          <AddingToPicklist
            pickList={pickList}
            type={parser.type ?? 'string'}
            value={pendingNewValue}
            onAdd={(): void => {
              canAddToPicklist?.(pendingNewValue);
              writeModelValue(pendingNewValue);
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
  const runWithLoading = React.useContext(LoadingContext);
  const isInvalidNumericValue = type === 'number' && f.parseInt(value) === undefined;

  return isInvalidNumericValue ? (
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
              runWithLoading(
                pickList
                  .rgetCollection('pickListItems')
                  .then(async (pickListItemsCollection) => {
                    const newItem = new tables.PickListItem.Resource();
                    newItem.set('title', value);
                    newItem.set('value', value);
                    pickListItemsCollection.add(newItem);
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
