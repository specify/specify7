import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { interactionsText } from '../../localization/interactions';
import { Button } from '../Atoms/Button';
import { formatDisjunction } from '../Atoms/Internationalization';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import type { UiCommands } from '../FormParse/commands';
import { LoanReturn } from '../Interactions/PrepReturnDialog';
import { Dialog } from '../Molecules/Dialog';
import { ReportsView } from '../Reports';
import { ShowLoansCommand } from './ShowTransactions';

export function GenerateLabel({
  resource,
  id,
  label,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly id: string | undefined;
  readonly label: LocalizedString | undefined;
}): JSX.Element | null {
  const [runReport, handleRunReport, handleHideReport] = useBooleanState();

  const isDisabled = resource.isNew() || !Boolean(resource.get('id'));
  return (
    <>
      <Button.Small
        disabled={isDisabled}
        id={id}
        title={isDisabled ? formsText.saveRecordFirst() : undefined}
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
  );
}

const commandRenderers: {
  readonly [KEY in keyof UiCommands]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly id: string | undefined;
    readonly label: LocalizedString | undefined;
    readonly commandDefinition: UiCommands[KEY];
  }) => JSX.Element | null;
} = {
  GenerateLabel,
  ShowLoans({ label, resource, id }) {
    const [showLoans, handleShow, handleHide] = useBooleanState();
    const preparation = toTable(resource, 'Preparation');
    return preparation === undefined ? null : (
      <>
        <Button.Small
          disabled={resource.isNew() || !Boolean(resource.get('id'))}
          id={id}
          onClick={handleShow}
        >
          {label}
        </Button.Small>
        {showLoans && (
          <ErrorBoundary dismissible>
            <ShowLoansCommand preparation={preparation} onClose={handleHide} />
          </ErrorBoundary>
        )}
      </>
    );
  },
  ReturnLoan({ id, label = '', resource }) {
    const [showDialog, handleShow, handleHide] = useBooleanState();
    const loan = toTable(resource, 'Loan');
    return loan === undefined ? null : (
      <>
        <Button.Small id={id} onClick={handleShow}>
          {label}
        </Button.Small>
        {showDialog ? (
          loan.isNew() || !Boolean(loan.get('id')) ? (
            <Dialog
              buttons={commonText.close()}
              dimensionsKey="ReturnLoan"
              header={label}
              onClose={handleHide}
            >
              {interactionsText.preparationsCanNotBeReturned()}
            </Dialog>
          ) : (
            <LoanReturn resource={loan} onClose={handleHide} />
          )
        ) : undefined}
      </>
    );
  },
  Unsupported({ commandDefinition: { name = commonText.nullInline() }, id }) {
    const [isClicked, handleShow, handleHide] = useBooleanState();
    return (
      <>
        <Button.Small id={id} onClick={handleShow}>
          {formsText.unavailableCommandButton()}
        </Button.Small>
        <Dialog
          buttons={commonText.close()}
          dimensionsKey="Unsupported"
          header={formsText.commandUnavailable()}
          isOpen={isClicked}
          onClose={handleHide}
        >
          {formsText.commandUnavailableDescription()}
          <br />
          {formsText.commandUnavailableSecondDescription()}
          <br />
          {commonText.colonLine({
            label: formsText.commandName(),
            value: name,
          })}
        </Dialog>
      </>
    );
  },
  Blank: () => null,
  WrongTable({ resource, commandDefinition: { supportedTables } }) {
    const [isVisible, handleShow, handleHide] = useBooleanState();
    return (
      <>
        <Button.Small onClick={handleShow}>
          {formsText.unavailableCommandButton()}
        </Button.Small>
        <Dialog
          buttons={commonText.close()}
          dimensionsKey="WrongTable"
          header={formsText.commandUnavailable()}
          isOpen={isVisible}
          onClose={handleHide}
        >
          {formsText.wrongTableForCommand({
            currentTable: resource.specifyModel.name,
            correctTable: formatDisjunction(supportedTables),
          })}
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
  readonly label: LocalizedString | undefined;
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
