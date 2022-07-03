import React from 'react';

import { error } from '../assert';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { UiCommands } from '../parseuicommands';
import { hasPermission, hasTablePermission } from '../permissions';
import { toTable } from '../specifymodel';
import { Button } from './basic';
import { useBooleanState } from './hooks';
import { Dialog } from './modaldialog';
import { LoanReturn } from './prepreturndialog';
import { ReportsView } from './reports';
import { ShowLoansCommand } from './showtranscommand';
import { ErrorBoundary } from './errorboundary';

const commandRenderers: {
  readonly [KEY in keyof UiCommands]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly id: string | undefined;
    readonly label: string | undefined;
    readonly commandDefinition: UiCommands[KEY];
  }) => JSX.Element | null;
} = {
  GenerateLabel({ id, label, resource }) {
    const [runReport, handleRunReport, handleHideReport] = useBooleanState();

    const isDisabled = resource.isNew() || !Boolean(resource.get('id'));
    return hasPermission('/report', 'execute') ? (
      <>
        <Button.Small
          id={id}
          onClick={handleRunReport}
          disabled={isDisabled}
          title={isDisabled ? formsText('saveRecordFirst') : undefined}
        >
          {label}
        </Button.Small>
        {runReport ? (
          <ReportsView
            model={resource.specifyModel}
            resourceId={resource.get('id')}
            autoSelectSingle={true}
            onClose={handleHideReport}
          />
        ) : undefined}
      </>
    ) : null;
  },
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
                  header={label ?? ''}
                  buttons={commonText('close')}
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
          isOpen={isClicked}
          onClose={handleHide}
          header={formsText('unavailableCommandDialogHeader')}
          buttons={commonText('close')}
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
      resource={resource}
      id={id}
      label={label}
      commandDefinition={commandDefinition as UiCommands['GenerateLabel']}
    />
  );
}
