import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { TableList, tablesFilter } from '../SchemaConfig/Tables';

export function ListOfBaseTables({
  onClick: handleClick,
}: {
  readonly onClick: (table: keyof Tables) => void;
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

  const filter = React.useCallback(
    (showAdvancedTables: boolean, table: SpecifyTable) =>
      tablesFilter(
        isNoRestrictionMode,
        showNoAccessTables,
        showAdvancedTables,
        table
      ),
    [isNoRestrictionMode, showNoAccessTables]
  );

  return (
    <TableList
      cacheKey="wbPlanViewUi"
      filter={filter}
      getAction={({ name }) =>
        () =>
          handleClick(name)
        }
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
