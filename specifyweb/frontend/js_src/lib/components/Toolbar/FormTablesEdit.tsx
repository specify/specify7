import React from 'react';

import type { Tables } from '../DataModel/types';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { hasTablePermission } from '../Permissions/helpers';
import { getModel, getModelById } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { GetSet, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { useBooleanState, useId } from '../../hooks/hooks';
import { Dialog } from '../Molecules/Dialog';
import { usePref } from '../UserPreferences/Hooks';
import { TablesListEdit } from './QueryTablesEdit';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';

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
  const [models, setModels] = useFormModels();
  const [showPrompt, handleProceed] = useBooleanState();
  const [isLegacy, handleLegacy, handleModern] = useBooleanState(
    models === 'legacy'
  );
  const id = useId('edit-form-tables');
  return showPrompt && Array.isArray(models) ? (
    <CustomEditTables
      models={models}
      onChange={setModels}
      onClose={handleClose}
    />
  ) : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('apply')}</Submit.Blue>
        </>
      }
      header={formsText('selectSourceOfTables')}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void => {
          if (isLegacy) {
            setModels('legacy');
            handleClose();
          } else {
            setModels([]);
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
          {formsText('inheritLegacySettings')}
        </Label.Inline>
        <Label.Inline>
          <Input.Radio
            checked={!isLegacy}
            name={id('radio')}
            onChange={handleModern}
          />
          {formsText('useCustomSettings')}
        </Label.Inline>
      </Form>
    </Dialog>
  );
}

export function useFormModels(): GetSet<RA<SpecifyModel> | 'legacy'> {
  const [tables, setTables] = usePref('form', 'general', 'shownTables');
  const visibleTables =
    tables === 'legacy'
      ? []
      : tables.length === 0
      ? filterArray(defaultFormTablesConfig.map(getModel))
      : tables.map(getModelById);
  const accessibleTables = visibleTables.filter(({ name }) =>
    hasTablePermission(name, 'read')
  );
  const handleChange = React.useCallback(
    (models: RA<SpecifyModel> | 'legacy') =>
      setTables(
        models === 'legacy' ? 'legacy' : models.map((model) => model.tableId)
      ),
    [setTables]
  );
  return [tables === 'legacy' ? 'legacy' : accessibleTables, handleChange];
}

function CustomEditTables({
  models,
  onChange: handleChange,
  onClose: handleClose,
}: {
  readonly models: RA<SpecifyModel>;
  readonly onChange: (tables: RA<SpecifyModel>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <TablesListEdit
      defaultTables={defaultFormTablesConfig}
      isNoRestrictionMode={false}
      models={models}
      onChange={handleChange}
      onClose={handleClose}
    />
  );
}
