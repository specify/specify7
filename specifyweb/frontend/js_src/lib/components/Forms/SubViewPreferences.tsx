import React from 'react';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { FormType } from '../FormParse';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { Label, Select } from '../Atoms/Form';
import { OrderPicker } from '../UserPreferences/Renderers';
import type { SubViewContext } from './SubView';

export function SubViewPreferences({
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
      <Label.Generic>
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
      </Label.Generic>
      {/* BUG: this change does not apply until you add/remove subview record */}
      <Label.Generic>
        {formsText('orderBy')}
        <OrderPicker
          model={model}
          order={sortField}
          onChange={handleChangeSortField}
        />
      </Label.Generic>
    </>
  );
}
