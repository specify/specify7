import React from 'react';

import { error } from '../Errors/assert';
import type { AnySchema } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { UiCommands } from '../FormParse/commands';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { toTable } from '../DataModel/specifyModel';
import { Button } from '../Atoms/Basic';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { useBooleanState } from '../../hooks/hooks';
import { Dialog } from '../Molecules/Dialog';
import { LoanReturn } from '../Interactions/PrepReturnDialog';
import { ReportsView } from '../Reports';
import { ShowLoansCommand } from './ShowTransactions';

export function GenerateLabel({
  resource,
  id,
  label,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly id: string | undefined;
  readonly label: string | undefined;
}): JSX.Element | null {
  const [runReport, handleRunReport, handleHideReport] = useBooleanState();

  const isDisabled = resource.isNew() || !Boolean(resource.get('id'));
  return hasPermission('/report', 'execute') ? (
    <>
      <Button.Small
        disabled={isDisabled}
        id={id}
        title={isDisabled ? formsText('saveRecordFirst') : undefined}
        onClick={handleRunReport}
      >
        {label}
      </Button.Small>
      {runReport ? (
        <ReportsView
          autoSelectSingle
          model={resource.specifyModel}
          resourceId={resource.get('id')}
          onClose={handleHideReport}
        />
      ) : undefined}
    </>
  ) : null;
}

const commandRenderers: {
  readonly [KEY in keyof UiCommands]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly id: string | undefined;
    readonly label: string | undefined;
    readonly commandDefinition: UiCommands[KEY];
  }) => JSX.Element | null;
} = {
  GenerateLabel,
  ShowLoans({ label, resource, id }) {
    const [showLoans, handleShow, handleHide] = useBooleanState();
    return (
      <>
        {resource.isNew() || !Boolean(resource.get('id')) ? undefined : (
          <Button.Small id={id} onClick={handleShow}>
            {label}
          </Button.Small>
        )}
        {showLoans && (
          <ErrorBoundary dismissable>
            <ShowLoansCommand resource={resource} onClose={handleHide} />
          </ErrorBoundary>
        )}
      </>
    );
  },
  ReturnLoan({ id, label, resource }) {
    const [showDialog, handleShow, handleHide] = useBooleanState();
    return hasTablePermission('LoanPreparation', 'update') &&
      hasTablePermission('LoanReturnPreparation', 'update')
      ? f.maybe(toTable(resource, 'Loan'), (loan) => (
          <>
            <Button.Small id={id} onClick={handleShow}>
              {label}
            </Button.Small>
            {showDialog ? (
              loan.isNew() || !Boolean(loan.get('id')) ? (
                <Dialog
                  buttons={commonText('close')}
                  header={label ?? ''}
                  onClose={handleHide}
                >
                  {formsText('preparationsCanNotBeReturned')}
                </Dialog>
              ) : (
                <LoanReturn resource={loan} onClose={handleHide} />
              )
            ) : undefined}
          </>
        )) ?? error('LoanReturnCommand can only be used with Loan resources')
      : null;
  },
  Unsupported({ commandDefinition: { name }, id }) {
    const [isClicked, handleShow, handleHide] = useBooleanState();
    return (
      <>
        <Button.Small id={id} onClick={handleShow}>
          {formsText('unavailableCommandButton')}
        </Button.Small>
        <Dialog
          buttons={commonText('close')}
          header={formsText('unavailableCommandDialogHeader')}
          isOpen={isClicked}
          onClose={handleHide}
        >
          {formsText('unavailableCommandDialogText')}
          <br />
          {`${formsText('commandName')} ${name ?? commonText('nullInline')}`}
        </Dialog>
      </>
    );
  },
};

export function UiCommand({
  resource,
  id,
  label,
  commandDefinition,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly id: string | undefined;
  readonly label: string | undefined;
  readonly commandDefinition: UiCommands[keyof UiCommands];
}): JSX.Element | null {
  const Command = commandRenderers[
    commandDefinition.type
  ] as typeof commandRenderers['GenerateLabel'];
  return (
    <Command
      commandDefinition={commandDefinition as UiCommands['GenerateLabel']}
      id={id}
      label={label}
      resource={resource}
    />
  );
}
