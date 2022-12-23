import React from 'react';

import { formsText } from '../../localization/forms';
import type { FormType } from '../FormParse';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { Label, Select } from '../Atoms/Form';
import { OrderPicker } from '../UserPreferences/Renderers';
import type { SubViewContext } from '../Forms/SubView';
import { attachmentsText } from '../../localization/attachments';
import { schema } from '../DataModel/schema';

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
        {schema.models.SpLocaleContainerItem.strictGetField('type').label}
        <Select
          value={formType}
          onValueChange={(formType): void =>
            handleChangeFormType(formType as FormType)
          }
        >
          <option value="form">{formsText.form()}</option>
          <option value="formTable">{formsText.formTable()}</option>
        </Select>
      </Label.Block>
      {/* BUG: this change does not apply until you add/remove subview record */}
      <Label.Block>
        {attachmentsText.orderBy()}
        <OrderPicker
          model={model}
          order={sortField}
          onChange={handleChangeSortField}
        />
      </Label.Block>
    </>
  );
}
