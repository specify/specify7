import React from 'react';

import { error } from '../assert';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { UiCommands } from '../parseuicommands';
import { hasPermission, hasTablePermission } from '../permissions';
import reports from '../reports';
import { toTable } from '../specifymodel';
import { Button } from './basic';
import { LoadingContext } from './contexts';
import { useBooleanState } from './hooks';
import { Dialog } from './modaldialog';
import { LoanReturn } from './prepreturndialog';
import { ShowLoansCommand } from './showtranscommand';

const commandRenderers: {
  readonly [KEY in keyof UiCommands]: (props: {
    readonly resource: SpecifyResource<AnySchema>;
    readonly id: string | undefined;
    readonly label: string | undefined;
    readonly commandDefinition: UiCommands[KEY];
  }) => JSX.Element | null;
} = {
  GenerateLabel({ id, label, resource }) {
    const [runReport, setRunReport] = React.useState(false);
    const loading = React.useContext(LoadingContext);

    React.useEffect(() => {
      if (!runReport || resource.isNew() || !Boolean(resource.get('id')))
        return;
      loading(
        // TODO: convert to React
        reports({
          tblId: resource.specifyModel.tableId,
          recordToPrintId: resource.get('id'),
          autoSelectSingle: true,
        }).then((view: { readonly render: () => void }) => {
          setRunReport(false);
          view.render();
        })
      );
    }, [loading, runReport, resource]);

    return hasPermission('/report', 'execute') ? (
      <>
        <Button.Simple id={id} onClick={(): void => setRunReport(true)}>
          {label}
        </Button.Simple>
        {runReport && (resource.isNew() || !Boolean(resource.get('id'))) ? (
          <Dialog
            header={label}
            buttons={commonText('close')}
            onClose={(): void => setRunReport(false)}
          >
            {formsText('reportsCanNotBePrintedDialogMessage')}
          </Dialog>
        ) : undefined}
      </>
    ) : null;
  },
  ShowLoans({ label, resource, id }) {
    const [showLoans, handleShow, handleHide] = useBooleanState();
    return (
      <>
        {resource.isNew() || !Boolean(resource.get('id')) ? undefined : (
          <Button.Simple id={id} onClick={handleShow}>
            {label}
          </Button.Simple>
        )}
        {showLoans && (
          <ShowLoansCommand resource={resource} onClose={handleHide} />
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
            <Button.Simple id={id} onClick={handleShow}>
              {label}
            </Button.Simple>
            {showDialog ? (
              loan.isNew() || !Boolean(loan.get('id')) ? (
                <Dialog
                  header={label}
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
        <Button.Simple id={id} onClick={handleShow}>
          {formsText('unavailableCommandButton')}
        </Button.Simple>
        <Dialog
          isOpen={isClicked}
          onClose={handleHide}
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
