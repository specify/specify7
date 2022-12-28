import React from 'react';

import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { UiCommands } from '../FormParse/commands';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { Button } from '../Atoms/Button';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog } from '../Molecules/Dialog';
import { LoanReturn } from '../Interactions/PrepReturnDialog';
import { ReportsView } from '../Reports';
import { ShowLoansCommand } from './ShowTransactions';
import { useBooleanState } from '../../hooks/useBooleanState';
import { AnySchema } from '../DataModel/helperTypes';
import { toTable } from '../DataModel/helpers';
import { softFail } from '../Errors/Crash';

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
    const preparation = toTable(resource, 'Preparation');
    if (preparation === undefined) {
      softFail(
        new Error('ShowLoans command can only be used on the preparation form')
      );
      return null;
    }
    return (
      <>
        <Button.Small
          id={id}
          onClick={handleShow}
          disabled={resource.isNew() || !Boolean(resource.get('id'))}
        >
          {label}
        </Button.Small>
        {showLoans && (
          <ErrorBoundary dismissable>
            <ShowLoansCommand preparation={preparation} onClose={handleHide} />
          </ErrorBoundary>
        )}
      </>
    );
  },
  ReturnLoan({ id, label = '', resource }) {
    const [showDialog, handleShow, handleHide] = useBooleanState();
    if (
      !hasTablePermission('LoanPreparation', 'update') &&
      hasTablePermission('LoanReturnPreparation', 'update')
    )
      return null;
    const loan = toTable(resource, 'Loan');
    if (loan === undefined) {
      softFail(
        new Error('LoanReturnCommand can only be used with Loan resources')
      );
      return null;
    }
    return (
      <>
        <Button.Small id={id} onClick={handleShow}>
          {label}
        </Button.Small>
        {showDialog ? (
          loan.isNew() || !Boolean(loan.get('id')) ? (
            <Dialog
              buttons={commonText('close')}
              header={label}
              onClose={handleHide}
            >
              {formsText('preparationsCanNotBeReturned')}
            </Dialog>
          ) : (
            <LoanReturn resource={loan} onClose={handleHide} />
          )
        ) : undefined}
      </>
    );
  },
  Unsupported({ commandDefinition: { name = commonText('nullInline') }, id }) {
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
          {`${formsText('commandName')} ${name}`}
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
