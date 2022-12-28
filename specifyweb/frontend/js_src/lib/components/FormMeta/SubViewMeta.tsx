import React from 'react';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { Label, Select } from '../Atoms/Form';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { FormType } from '../FormParse';
import type { SubViewContext } from '../Forms/SubView';
import { OrderPicker } from '../UserPreferences/Renderers';

export function SubViewMeta({
  subView,
  model,
}: {
  readonly subView: Exclude<
    React.ContextType<typeof SubViewContext>,
    undefined
  >;
  readonly model: SpecifyModel;
}): JSX.Element {
  const { formType, sortField, handleChangeFormType, handleChangeSortField } =
    subView;
  return (
    <>
      <Label.Block>
        {commonText('type')}
        <Select
          value={formType}
          onValueChange={(formType): void =>
            handleChangeFormType(formType as FormType)
          }
        >
          <option value="form">{formsText('form')}</option>
          <option value="formTable">{formsText('formTable')}</option>
        </Select>
      </Label.Block>
      {/* BUG: this change does not apply until you add/remove subview record */}
      <Label.Block>
        {formsText('orderBy')}
        <OrderPicker
          model={model}
          order={
            sortField === undefined
              ? undefined
              : `${
                  sortField.direction === 'desc' ? '-' : ''
                }${sortField.fieldNames.join('.')}`
          }
          onChange={(sortField): void =>
            handleChangeSortField({
              fieldNames: (sortField.startsWith('-')
                ? sortField.slice(1)
                : sortField
              ).split('.'),
              direction: sortField.startsWith('-') ? 'desc' : 'asc',
            })
          }
        />
      </Label.Block>
    </>
  );
}
