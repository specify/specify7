import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { GetSet, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable, getTableById } from '../DataModel/tables';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { TablesListEdit } from '../Toolbar/QueryTablesEdit';
import { defaultVisibleForms } from './fetchTables';

export type TableType = 'form' | 'interactions';

export function EditFormTables({
  onClose: handleClose,
  type,
}: {
  readonly onClose: () => void;
  readonly type: TableType;
}): JSX.Element {
  const [tables, setTables] = useFormTables(type);
  const [showPrompt, handleProceed] = useBooleanState();
  const [isLegacy, handleLegacy, handleModern] = useBooleanState(
    tables === 'legacy'
  );
  const id = useId('edit-form-tables');
  return showPrompt && Array.isArray(tables) ? (
    <CustomEditTables
      tables={tables}
      type={type}
      onChange={setTables}
      onClose={handleClose}
    />
  ) : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Info form={id('form')}>{commonText.apply()}</Submit.Info>
        </>
      }
      header={formsText.selectSourceOfTables()}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void => {
          if (isLegacy) {
            setTables('legacy');
            handleClose();
          } else {
            if (tables === 'legacy') setTables([]);
            handleProceed();
          }
        }}
      >
        <Label.Inline>
          <Input.Radio
            checked={isLegacy}
            name={id('radio')}
            onChange={handleLegacy}
          />
          {formsText.inheritLegacySettings()}
        </Label.Inline>
        <Label.Inline>
          <Input.Radio
            checked={!isLegacy}
            name={id('radio')}
            onChange={handleModern}
          />
          {formsText.useCustomSettings()}
        </Label.Inline>
      </Form>
    </Dialog>
  );
}

export function useFormTables(
  type: TableType
): GetSet<RA<SpecifyTable> | 'legacy'> {
  const [tables, setTables] = userPreferences.use(
    type,
    'general',
    'shownTables'
  );
  const visibleTables =
    tables === 'legacy'
      ? []
      : tables.length === 0
        ? filterArray(defaultVisibleForms[type].map(getTable))
        : tables.map(getTableById);
  const accessibleTables = visibleTables.filter(({ name }) =>
    hasTablePermission(name, 'read')
  );
  const handleChange = React.useCallback(
    (tables: RA<SpecifyTable> | 'legacy') =>
      setTables(
        tables === 'legacy' ? 'legacy' : tables.map(({ tableId }) => tableId)
      ),
    [setTables]
  );
  return [tables === 'legacy' ? 'legacy' : accessibleTables, handleChange];
}

function CustomEditTables({
  tables,
  type,
  onChange: handleChange,
  onClose: handleClose,
}: {
  readonly tables: RA<SpecifyTable>;
  readonly type: TableType;
  readonly onChange: (tables: RA<SpecifyTable>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <TablesListEdit
      defaultTables={defaultVisibleForms[type]}
      header={
        type === 'form'
          ? formsText.configureDataEntryTables()
          : formsText.configureInteractionTables()
      }
      isNoRestrictionMode={false}
      tables={tables}
      onChange={handleChange}
      onClose={handleClose}
    />
  );
}
