import React from 'react';

import { Button } from './components/basic';
import { crash } from './components/errorboundary';
import { Dialog, LoadingScreen } from './components/modaldialog';
import { LoanReturn } from './components/prepreturndialog';
import { ShowLoansCommand } from './components/showtranscommand';
import type { AnySchema } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import commonText from './localization/common';
import formsText from './localization/forms';
import type { UiCommands } from './parseuicommands';
import reports from './reports';
import { isResourceOfType } from './specifymodel';

const commandRenderers: {
  readonly [KEY in keyof UiCommands]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly id: string | undefined;
    readonly label: string | undefined;
    readonly commandDefinition: UiCommands[KEY];
  }) => JSX.Element;
} = {
  GenerateLabel({ id, label, resource }) {
    const [runReport, setRunReport] = React.useState(false);

    React.useEffect(() => {
      if (!runReport || resource.isNew() || !Boolean(resource.get('id')))
        return;
      // TODO: convert to React
      reports({
        tblId: resource.specifyModel.tableId,
        recordToPrintId: resource.get('id'),
        autoSelectSingle: true,
      })
        .then((view) => {
          setRunReport(false);
          view.render();
        })
        .catch(crash);
    }, [runReport, resource]);

    return (
      <>
        <Button.Simple id={id} onClick={(): void => setRunReport(true)}>
          {label}
        </Button.Simple>
        {runReport ? (
          resource.isNew() || !Boolean(resource.get('id')) ? (
            <Dialog
              header={label}
              buttons={commonText('close')}
              onClose={(): void => setRunReport(false)}
            >
              {formsText('reportsCanNotBePrintedDialogMessage')}
            </Dialog>
          ) : (
            <LoadingScreen />
          )
        ) : undefined}
      </>
    );
  },
  ShowLoans({ label, resource, id }) {
    const [showLoans, setShowLoans] = React.useState(false);
    return (
      <>
        {resource.isNew() || !Boolean(resource.get('id')) ? undefined : (
          <Button.Simple id={id} onClick={(): void => setShowLoans(true)}>
            {label}
          </Button.Simple>
        )}
        {showLoans && (
          <ShowLoansCommand
            resource={resource}
            onClose={(): void => setShowLoans(false)}
          />
        )}
      </>
    );
  },
  ReturnLoan({ id, label, resource }) {
    const [showDialog, setShowDialog] = React.useState(false);
    if (!isResourceOfType(resource, 'Loan'))
      throw new Error('LoanReturnCommand can only be used with Loan resources');
    return (
      <>
        <Button.Simple id={id} onClick={(): void => setShowDialog(true)}>
          {label}
        </Button.Simple>
        {showDialog ? (
          resource.isNew() || !Boolean(resource.get('id')) ? (
            <Dialog
              header={label}
              buttons={commonText('close')}
              onClose={(): void => setShowDialog(false)}
            >
              {formsText('preparationsCanNotBeReturned')}
            </Dialog>
          ) : (
            <LoanReturn
              resource={resource}
              onClose={(): void => setShowDialog(false)}
            />
          )
        ) : undefined}
      </>
    );
  },
  Unsupported({ commandDefinition: { name }, id }) {
    const [isClicked, setIsClicked] = React.useState(false);
    return (
      <>
        <Button.Simple id={id} onClick={(): void => setIsClicked(true)}>
          {formsText('unavailableCommandButton')}
        </Button.Simple>
        <Dialog
          isOpen={isClicked}
          onClose={(): void => setIsClicked(false)}
          title={formsText('unavailableCommandDialogTitle')}
          header={formsText('unavailableCommandDialogHeader')}
          buttons={commonText('close')}
        >
          {formsText('unavailableCommandDialogMessage')}
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
}): JSX.Element {
  return commandRenderers[commandDefinition.type]({
    resource,
    id,
    label,
    commandDefinition,
  });
}
