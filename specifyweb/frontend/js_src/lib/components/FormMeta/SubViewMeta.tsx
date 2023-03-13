import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { formsText } from '../../localization/forms';
import { Label, Select } from '../Atoms/Form';
import { getField } from '../DataModel/helpers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { FormType } from '../FormParse';
import type { SubViewContext } from '../Forms/SubView';
import { toLargeSortConfig, toSmallSortConfig } from '../Molecules/Sorting';
import { OrderPicker } from '../UserPreferences/Renderers';
import { tables } from '../DataModel/tables';

export function SubViewMeta({
  subView,
  table,
}: {
  readonly subView: Exclude<
    React.ContextType<typeof SubViewContext>,
    undefined
  >;
  readonly table: SpecifyTable;
}): JSX.Element {
  const { formType, sortField, handleChangeFormType, handleChangeSortField } =
    subView;
  return (
    <>
      <Label.Block>
        {getField(tables.SpLocaleContainerItem, 'type').label}
        <Select
          value={formType}
          onValueChange={(formType): void =>
            handleChangeFormType(formType as FormType)
          }
        >
          <option value="form">{formsText.subForm()}</option>
          <option value="formTable">{formsText.formTable()}</option>
        </Select>
      </Label.Block>
      {/* BUG: this change does not apply until you add/remove subview record */}
      <Label.Block>
        {attachmentsText.orderBy()}
        <OrderPicker
          table={table}
          order={
            sortField === undefined ? undefined : toSmallSortConfig(sortField)
          }
          onChange={(sortField): void =>
            handleChangeSortField(toLargeSortConfig(sortField))
          }
        />
      </Label.Block>
    </>
  );
}
