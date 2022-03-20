import React from 'react';

import { error } from '../assert';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { UiCommands } from '../parseuicommands';
import reports from '../reports';
import { toTable } from '../specifymodel';
import { f } from '../wbplanviewhelper';
import { Button } from './basic';
import { crash } from './errorboundary';
import { useBooleanState } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';
import { LoanReturn } from './prepreturndialog';
import { ShowLoansCommand } from './showtranscommand';

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
    return (
      f.maybe(toTable(resource, 'Loan'), (loan) => (
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
    );
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
}): JSX.Element {
  return (
    commandRenderers[
      commandDefinition.type
    ] as typeof commandRenderers['GenerateLabel']
  )({
    resource,
    id,
    label,
    commandDefinition: commandDefinition as UiCommands['GenerateLabel'],
  });
}
