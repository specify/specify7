/**
 * Specify form PickList
 */

import React from 'react';

import { error } from '../assert';
import type { PickList } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import type { FormMode } from '../parseform';
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
import { TreeLevelComboBox } from './treelevelcombobox';
import { UiField } from './uifield';

export type DefaultComboBoxProps = {
  readonly id: string | undefined;
  readonly model: SpecifyResource<AnySchema>;
  readonly resource: SpecifyResource<AnySchema>;
  readonly field: LiteralField | Relationship;
  readonly pickListName: string | undefined;
  readonly defaultValue: string | undefined;
  readonly className: string | undefined;
  readonly mode: FormMode;
  readonly isRequired: boolean;
  readonly isDisabled: boolean;
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
          ? fetchPickList(props.pickListName).then((pickList) =>
              typeof pickList === 'undefined'
                ? error('Unable to find pick list', props)
                : pickList
            )
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
   * TODO: test if can add items to PickListTypes.FIELD
   * TODO: make other pick list types editable
   */
  const mode =
    // Only PickListTypes.ITEMS pick lists are editable
    pickList?.get('type') !== PickListTypes.ITEMS ? 'view' : props.mode;

  return typeof pickList === 'object' && Array.isArray(items) ? (
    <PickListComboBox
      {...props}
      mode={mode}
      pickList={pickList}
      items={items}
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
      defaultValue={commonText('loading')}
      required={props.isRequired}
      className={props.className}
    />
  );
}

export function ComboBox({
  fieldName,
  ...props
}: Omit<DefaultComboBoxProps, 'field'> & {
  readonly field: LiteralField | Relationship | undefined;
  readonly fieldName: string | undefined;
}): JSX.Element {
  const { resource, field, model } = props;

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

  const resolvedField =
    isResourceOfType(resource, 'PickList') && fieldName === 'typesCBX'
      ? defined(schema.models.PickList.getField('type'))
      : resource.specifyModel.name === 'Accession' &&
        fieldName === 'divisionCBX'
      ? defined(schema.models.Accession.getField('division'))
      : field;

  if (typeof resolvedField !== 'object')
    throw new Error(
      `can't setup picklist for unknown field ${model.specifyModel.name}.${fieldName}`
    );

  const pickListName = props.pickListName ?? resolvedField.getPickList();

  if (typeof pickListName === 'string')
    return (
      <DefaultComboBox
        {...props}
        field={resolvedField}
        pickListName={pickListName}
      />
    );
  else {
    console.error(
      `Unable to resolve a pick list for ${model.specifyModel.name}.${fieldName}`
    );
    return (
      <UiField
        id={props.id}
        resource={props.resource}
        mode={props.mode}
        fieldName={resolvedField.name}
      />
    );
  }
}
