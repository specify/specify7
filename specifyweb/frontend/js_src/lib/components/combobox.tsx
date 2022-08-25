/**
 * Specify form PickList
 */

import React from 'react';

import type { PickList } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import type { FormMode, FormType } from '../parseform';
import { hasToolPermission } from '../permissionutils';
import {
  fetchPickList,
  getPickListItems,
  PickListTypes,
} from '../picklistmixins';
import { schema } from '../schema';
import type { LiteralField, Relationship } from '../specifyfield';
import { isResourceOfType } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { Input } from './basic';
import { useAsyncState, useLiveState } from './hooks';
import { PickListComboBox } from './picklist';
import { PickListFieldComboBox } from './picklistfieldcombobox';
import { PickListFormatterComboBox } from './picklistformattercombobox';
import { PickListTableComboBox } from './picklisttablecombobox';
import { QueryComboBox } from './querycombobox';
import { TreeLevelComboBox } from './treelevelcombobox';
import { UiField } from './uifield';

export type DefaultComboBoxProps = {
  readonly id: string | undefined;
  readonly model: SpecifyResource<AnySchema>;
  readonly resource: SpecifyResource<AnySchema>;
  readonly field: LiteralField | Relationship;
  readonly pickListName: string | undefined;
  readonly defaultValue: string | undefined;
  readonly mode: FormMode;
  readonly isRequired: boolean;
  readonly isDisabled: boolean;
  readonly formType: FormType;
};

export type PickListItemSimple = {
  readonly value: string;
  readonly title: string;
};

function DefaultComboBox(props: DefaultComboBoxProps): JSX.Element | null {
  const [pickList] = useAsyncState<SpecifyResource<PickList>>(
    React.useCallback(
      () =>
        typeof props.pickListName === 'string'
          ? fetchPickList(props.pickListName).then((pickList) => {
              if (pickList === undefined)
                console.error('Unable to find pick list', props);
              return pickList;
            })
          : undefined,
      [props.pickListName]
    ),
    false
  );

  const [items, setItems] = useLiveState<RA<PickListItemSimple> | undefined>(
    React.useCallback(
      () =>
        typeof pickList === 'object' ? getPickListItems(pickList) : undefined,
      [pickList]
    )
  );

  /*
   * TEST: test if can add items to PickListTypes.FIELD
   * FEATURE: make other pick list types editable
   */
  const mode =
    // Only PickListTypes.ITEMS pick lists are editable
    pickList?.get('type') !== PickListTypes.ITEMS || pickList?.get('isSystem')
      ? 'view'
      : props.mode;

  return typeof pickList === 'object' && Array.isArray(items) ? (
    <PickListComboBox
      {...props}
      items={items}
      mode={props.mode}
      pickList={pickList}
      onAdd={
        mode === 'view'
          ? undefined
          : (value): void =>
              setItems([
                ...items,
                {
                  title: value,
                  value,
                },
              ])
      }
    />
  ) : (
    <Input.Text
      disabled
      required={props.isRequired}
      // BUG: required has no effect while disabled. Need a better solution
      value={commonText('loading')}
    />
  );
}

export function ComboBox({
  fieldName,
  ...props
}: Omit<DefaultComboBoxProps, 'field'> & {
  readonly field: LiteralField | Relationship | undefined;
  readonly fieldName: string | undefined;
}): JSX.Element | null {
  const { resource, field, model, id, mode, formType, isRequired } = props;

  if (isResourceOfType(resource, 'PickList') && fieldName === 'fieldsCBX')
    return (
      <PickListFieldComboBox
        {...props}
        field={defined(schema.models.PickList.getField('fieldName'))}
      />
    );
  else if (
    isResourceOfType(resource, 'PickList') &&
    fieldName === 'formatterCBX'
  )
    return (
      <PickListFormatterComboBox
        {...props}
        field={defined(schema.models.PickList.getField('formatter'))}
      />
    );
  else if (isResourceOfType(resource, 'PickList') && fieldName === 'tablesCBX')
    return (
      <PickListTableComboBox
        {...props}
        field={defined(schema.models.PickList.getField('tableName'))}
      />
    );
  else if (fieldName === 'definitionItem')
    return (
      <TreeLevelComboBox
        {...props}
        field={defined(model.specifyModel.getField('definitionItem'))}
      />
    );
  else if (fieldName === 'divisionCBX') {
    const field = defined(resource.specifyModel.getField('division'));
    return (
      <QueryComboBox
        fieldName={field.name}
        forceCollection={undefined}
        formType={formType}
        id={id}
        isRequired={isRequired}
        mode={mode}
        relatedModel={undefined}
        resource={resource}
        typeSearch={undefined}
      />
    );
  }

  const resolvedField =
    isResourceOfType(resource, 'PickList') && fieldName === 'typesCBX'
      ? defined(schema.models.PickList.getField('type'))
      : field;

  if (typeof resolvedField !== 'object') {
    console.error(
      `can't setup picklist for unknown field ${model.specifyModel.name}.${fieldName}`
    );
    return null;
  }

  const pickListName = props.pickListName ?? resolvedField.getPickList();

  if (typeof pickListName === 'string')
    return hasToolPermission('pickLists', 'read') ? (
      <DefaultComboBox
        {...props}
        field={resolvedField}
        pickListName={pickListName}
      />
    ) : (
      <UiField
        fieldName={resolvedField.name}
        id={props.id}
        mode="view"
        resource={props.resource}
      />
    );
  else {
    console.error(
      `Unable to resolve a pick list for ${model.specifyModel.name}.${fieldName}`
    );
    return (
      <UiField
        fieldName={resolvedField.name}
        id={props.id}
        mode={props.mode}
        resource={props.resource}
      />
    );
  }
}
