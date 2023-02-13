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
import { getTable, getTableById } from '../DataModel/tables';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { usePref } from '../UserPreferences/usePref';
import { TablesListEdit } from '../Toolbar/QueryTablesEdit';

export const defaultFormTablesConfig: RA<keyof Tables> = [
  'CollectionObject',
  'CollectingEvent',
  'Locality',
  'Taxon',
  'Agent',
  'Geography',
  'DNASequence',
  'ReferenceWork',
];

export function EditFormTables({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  const [tables, setTables] = useFormTables();
  const [showPrompt, handleProceed] = useBooleanState();
  const [isLegacy, handleLegacy, handleModern] = useBooleanState(
    tables === 'legacy'
  );
  const id = useId('edit-form-tables');
  return showPrompt && Array.isArray(tables) ? (
    <CustomEditTables
      tables={tables}
      onChange={setTables}
      onClose={handleClose}
    />
  ) : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText.apply()}</Submit.Blue>
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

export function useFormTables(): GetSet<RA<SpecifyTable> | 'legacy'> {
  const [tables, setTables] = usePref('form', 'general', 'shownTables');
  const visibleTables =
    tables === 'legacy'
      ? []
      : tables.length === 0
      ? filterArray(defaultFormTablesConfig.map(getTable))
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
  onChange: handleChange,
  onClose: handleClose,
}: {
  readonly tables: RA<SpecifyTable>;
  readonly onChange: (tables: RA<SpecifyTable>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <TablesListEdit
      defaultTables={defaultFormTablesConfig}
      header={formsText.configureDataEntryTables()}
      isNoRestrictionMode={false}
      tables={tables}
      onChange={handleChange}
      onClose={handleClose}
    />
  );
}
