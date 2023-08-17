import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import { schema } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { MappingElement } from './LineComponents';

export function ListOfBaseTables({
  onChange: handleChange,
  showHiddenTables,
}: {
  readonly onChange: (newTable: keyof Tables) => void;
  readonly showHiddenTables: boolean;
}): JSX.Element {
  const [isNoRestrictionMode] = userPreferences.use(
    'workBench',
    'wbPlanView',
    'noRestrictionsMode'
  );
  const [showNoAccessTables] = userPreferences.use(
    'workBench',
    'wbPlanView',
    'showNoAccessTables'
  );
  const fieldsData = Object.fromEntries(
    Object.entries(schema.models)
      .filter(
        ([tableName, { overrides }]) =>
          (isNoRestrictionMode ||
            (!overrides.isSystem && !overrides.isHidden)) &&
          (overrides.isCommon || showHiddenTables) &&
          (showNoAccessTables || hasTablePermission(tableName, 'create'))
      )
      .map(
        ([tableName, { label, overrides }]) =>
          [
            tableName,
            {
              optionLabel: label,
              tableName,
              isRelationship: true,
              isHidden: !overrides.isCommon,
            },
          ] as const
      )
  );
  return (
    <MappingElement
      customSelectSubtype="tree"
      customSelectType="BASE_TABLE_SELECTION_LIST"
      fieldsData={fieldsData}
      isOpen
      onChange={({ newValue }): void => handleChange(newValue as keyof Tables)}
    />
  );
}

export function ButtonWithConfirmation(props: {
  readonly children: React.ReactNode;
  readonly dialogHeader: LocalizedString;
  readonly dialogMessage: React.ReactNode;
  readonly dialogButtons: (
    confirm: () => void
  ) => Parameters<typeof Dialog>[0]['buttons'];
  readonly onConfirm: () => void;
  readonly showConfirmation?: () => boolean;
  readonly disabled?: boolean;
}): JSX.Element {
  const [displayPrompt, handleShow, handleHide] = useBooleanState();

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        disabled={props.disabled}
        onClick={(): void =>
          props.showConfirmation === undefined || props.showConfirmation()
            ? handleShow()
            : props.onConfirm()
        }
      >
        {props.children}
      </Button.Small>
      <Dialog
        buttons={props.dialogButtons(() => {
          handleHide();
          props.onConfirm();
        })}
        className={{
          container: dialogClassNames.narrowContainer,
        }}
        header={props.dialogHeader}
        isOpen={displayPrompt}
        onClose={handleHide}
      >
        {props.dialogMessage}
      </Dialog>
    </>
  );
}
