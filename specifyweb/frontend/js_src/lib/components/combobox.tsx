import React from 'react';

import { error } from '../assert';
import Backbone from '../backbone';
import type { PickList } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { fetchPickList, getPickListItems } from '../picklistmixins';
import { schema } from '../schema';
import type { LiteralField, Relationship } from '../specifyfield';
import type { RA } from '../types';
import { defined } from '../types';
import { useAsyncState } from './hooks';
import { PickListComboBox } from './picklist';
import { PickListFieldComboBox } from './picklistfieldcombobox';
import { PickListFormatterComboBox } from './picklistformattercombobox';
import createBackboneView from './reactbackboneextend';
import { TreeLevelComboBox } from './treelevelcombobox';
import { UserTypeComboBox } from './usertypecombobox';

export type DefaultComboBoxProps = {
  readonly model: SpecifyResource<AnySchema>;
  readonly resource: SpecifyResource<AnySchema>;
  readonly field: LiteralField | Relationship;
  readonly fieldName: string;
  readonly pickListName: string | undefined;
  readonly defaultValue: string | undefined;
  readonly className: string | undefined;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
};

export type PickListItemSimple = {
  readonly value: string;
  readonly title: string;
};

export const PickListTypes = {
  // Items are defined in the PickListItems table
  ITEMS: 0,
  // Items are defined from formatted rows in some table
  TABLE: 1,
  // Items are defined from a column in some table
  FIELDS: 2,
} as const;

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
    )
  );

  const [items, setItems] = useAsyncState<RA<PickListItemSimple>>(
    React.useCallback(
      () =>
        typeof pickList === 'object' ? getPickListItems(pickList) : undefined,
      [pickList]
    )
  );

  // Only PickListTypes.ITEMS pick lists are editable
  const readOnly =
    /*
     * TODO: test if can add items to PickListTypes.FIELD
     * TODO: make other pick list types editable
     */
    pickList?.get('type') !== PickListTypes.ITEMS || props.readOnly;

  return typeof pickList === 'object' && Array.isArray(items) ? (
    <PickListComboBox
      {...props}
      pickList={pickList}
      items={items}
      onAdd={
        readOnly
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
  ) : null;
}

function ComboBox(props: DefaultComboBoxProps): JSX.Element {
  const { resource, field, fieldName, model } = props;

  if (resource.specifyModel.name === 'PickList' && fieldName === 'fieldsCBX')
    return (
      <PickListFieldComboBox
        {...props}
        field={defined(schema.models.PickList.getField('fieldName'))}
      />
    );
  else if (
    resource.specifyModel.name === 'PickList' &&
    fieldName === 'formatterCBX'
  )
    return (
      <PickListFormatterComboBox
        {...props}
        field={defined(schema.models.PickList.getField('formatter'))}
      />
    );
  else if (fieldName === 'definitionItem')
    return <TreeLevelComboBox {...props} />;

  const resolvedField =
    resource.specifyModel.name === 'PickList' && fieldName === 'typesCBX'
      ? defined(schema.models.PickList.getField('type'))
      : resource.specifyModel.name === 'PickList' && fieldName === 'tablesCBX'
      ? defined(schema.models.PickList.getField('tableName'))
      : resource.specifyModel.name === 'Accession' &&
        fieldName === 'divisionCBX'
      ? defined(schema.models.Accession.getField('division'))
      : field;

  if (typeof resolvedField !== 'object')
    throw new Error(
      `can't setup picklist for unknown field ${model.specifyModel.name}.${fieldName}`
    );

  const pickListName = props.pickListName ?? resolvedField.getPickList();

  if (pickListName === 'UserType') return <UserTypeComboBox {...props} />;

  if (!Boolean(pickListName))
    throw new Error(
      `can't determine picklist for field ${resource.specifyModel.name}.${resolvedField.name}`
    );

  return <DefaultComboBox {...props} field={resolvedField} />;
}

const ComboBoxView = createBackboneView(ComboBox);

export default Backbone.View.extend({
  __name__: 'ComboBoxView',
  render() {
    const fieldName = this.el.getAttribute('name');
    this.model
      .getResourceAndField(fieldName)
      .then(([resource, field]: [SpecifyResource<AnySchema>, LiteralField]) => {
        this.view = new ComboBoxView({
          model: this.model,
          resource,
          field,
          fieldName,
          pickListName: this.$el.data('specify-picklist'),
          defaultValue: this.$el.data('specify-default'),
          className: this.el.getAttribute('class') ?? undefined,
          disabled: this.el.disabled,
          readOnly: this.el.readOnly,
          required: this.el.required,
        }).render();

        this.$el.replaceWith(this.view.el);
        this.setElement(this.view.el);

        return undefined;
      });

    return this;
  },
  remove() {
    this.view?.remove();
    Backbone.View.prototype.remove.call(this);
  },
});
