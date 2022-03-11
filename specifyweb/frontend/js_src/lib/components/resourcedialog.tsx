import React from 'react';

import type { AnySchema } from '../datamodelutils';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { Button } from './basic';
import { Dialog, dialogClassNames, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { ResourceViewProps } from './resourceview';
import { ResourceView } from './resourceview';

// FIXME: test
export function ResourceDialog<SCHEMA extends AnySchema = AnySchema>({
  isReadOnly,
  extraButton,
  children,
  ...rest
}: Omit<ResourceViewProps<SCHEMA>, 'mode' | 'isSubView'> & {
  readonly isReadOnly: boolean;
  // TODO: remove this once RecordSetsDialog is converted to React
  readonly extraButton?: {
    readonly label: string;
    readonly onClick: () => void;
  };
}): JSX.Element {
  const [showUnloadProtect, setShowUnloadProtect] = React.useState(false);
  return (
    <ResourceView
      {...rest}
      mode={isReadOnly ? 'view' : 'edit'}
      isSubView={false}
    >
      {({
        isLoading,
        isModified,
        title,
        saveButton,
        deleteButton,
        form,
        specifyNetworkBadge,
      }): JSX.Element => {
        return isLoading ? (
          <>
            <LoadingScreen />
            {/* FIXME: test if this is needed */}
            <div className="hidden">{form}</div>
          </>
        ) : (
          <>
            <Dialog
              // FIXME: Warn before closing dialog with unsaved changes here and in RecordSelectorDialog
              header={title}
              headerButtons={specifyNetworkBadge}
              onClose={(): void => {
                if (isModified) setShowUnloadProtect(true);
                else rest.onClose();
              }}
              buttons={
                <>
                  {deleteButton}
                  {saveButton}
                  {typeof extraButton === 'object' ? (
                    <Button.Gray onClick={extraButton.onClick}>
                      {extraButton.label}
                    </Button.Gray>
                  ) : undefined}
                  {isModified ? (
                    <Button.DialogClose component={Button.Red}>
                      {commonText('cancel')}
                    </Button.DialogClose>
                  ) : (
                    <Button.DialogClose component={Button.Blue}>
                      {commonText('close')}
                    </Button.DialogClose>
                  )}
                </>
              }
              className={{ container: dialogClassNames.wideContainer }}
            >
              {children}
            </Dialog>
            {showUnloadProtect && (
              <Dialog
                title={commonText('leavePageDialogTitle')}
                header={commonText('leavePageDialogHeader')}
                onClose={(): void => setShowUnloadProtect(false)}
                buttons={
                  <>
                    <Button.DialogClose>
                      {commonText('cancel')}
                    </Button.DialogClose>
                    <Button.Red onClick={rest.onClose}>
                      {commonText('leave')}
                    </Button.Red>
                  </>
                }
              >
                {formsText('unsavedFormUnloadProtect')}
              </Dialog>
            )}
          </>
        );
      }}
    </ResourceView>
  );
}

export const ResourceDialogView = createBackboneView(ResourceDialog);
