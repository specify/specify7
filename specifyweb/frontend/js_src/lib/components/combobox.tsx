import React from 'react';

import Backbone from '../backbone';
import type { PickList } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { fetchPickList } from '../picklistmixins';
import type { LiteralField } from '../specifyfield';
import type { RA } from '../types';
import { DivisionFieldComboBox } from './divisionfieldcombobox';
import { PickListComboBox } from './picklist';
import { PickListFieldComboBox } from './picklistfieldcombobox';
import { PickListTableComboBox } from './picklisttablecombobox';
import { PickListTypeComboBox } from './picklisttypecombobox';
import createBackboneView from './reactbackboneextend';
import { TreeLevelComboBox } from './treelevelcombobox';
import { UserTypeComboBox } from './usertypecombobox';
import { useAsyncState } from './hooks';
import { error } from '../assert';

export type DefaultComboBoxProps = {
  readonly model: SpecifyResource<AnySchema>;
  readonly resource: SpecifyResource<AnySchema>;
  readonly field: LiteralField;
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
  TABLE: 0,
  RECORDS: 1,
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
        typeof pickList === 'object'
          ? serializeResource(pickList).pickListItems.map(
              ({ title, value }) => ({
                title: title ?? value,
                value: value ?? title,
              })
            )
          : undefined,
      [pickList]
    )
  );

  // This type has to be readOnly
  const readOnly =
    pickList?.get('type') === PickListTypes.RECORDS || props.readOnly;

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

  if (resource.specifyModel.name === 'PickList' && fieldName === 'typesCBX')
    return <PickListTypeComboBox {...props} />;
  else if (
    resource.specifyModel.name === 'PickList' &&
    fieldName === 'tablesCBX'
  )
    return <PickListTableComboBox {...props} />;
  else if (
    resource.specifyModel.name === 'PickList' &&
    fieldName === 'fieldsCBX'
  )
    return <PickListFieldComboBox {...props} />;
  else if (
    resource.specifyModel.name === 'Accession' &&
    fieldName === 'divisionCBX'
  )
    return <DivisionFieldComboBox {...props} />;
  else if (fieldName === 'definitionItem')
    return <TreeLevelComboBox {...props} />;

  if (typeof field !== 'object')
    throw new Error(
      `can't setup picklist for unknown field ${model.specifyModel.name}.${fieldName}`
    );

  const pickListName = props.pickListName ?? field.getPickList();

  if (pickListName === 'UserType') return <UserTypeComboBox {...props} />;

  if (!Boolean(pickListName))
    throw new Error(
      `can't determine picklist for field ${resource.specifyModel.name}.${field.name}`
    );

  return <DefaultComboBox {...props} />;
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
