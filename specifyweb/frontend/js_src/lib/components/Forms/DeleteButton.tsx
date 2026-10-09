import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { treeText } from '../../localization/tree';
import { StringToJsx } from '../../localization/utils';
import { overwriteReadOnly } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { FormattedResource } from '../Molecules/FormattedResource';
import { TableIcon } from '../Molecules/TableIcon';
import { DeleteBlockerProvider } from '../DeleteBlockers/Context';
import { DeleteBlockers } from '../DeleteBlockers';
import { useDeleteBlockersForResource } from '../DeleteBlockers/useDeleteBlockersForResource';
import { mergingText } from '../../localization/merging';
import { loadingBar } from '../Molecules';
import { useDeleteBlockerCount } from '../DeleteBlockers/useReferenceCount';

export type DeleteButtonProps<SCHEMA extends AnySchema> = {
  readonly resource: SpecifyResource<SCHEMA>;
  /**
   * As a performance optimization, can defer checking for delete blockers
   * until the button is clicked. This is used in the tree viewer as delete
   * button's resource can change often.
   */
  readonly deferred?: boolean;
};

export function DeleteButtonWrapped<SCHEMA extends AnySchema>(
  deleteBlockerProps: Parameters<typeof DeleteButton>[0]
): JSX.Element {
  return (
    <DeleteBlockerProvider>
      <DeleteButton<SCHEMA> {...deleteBlockerProps} />
    </DeleteBlockerProvider>
  );
}

/**
 * A button to delele a resorce
 * Prompts before deletion
 * Checks for delete blockers (other resources depending on this one) before
 * deletion
 */
function DeleteButton<SCHEMA extends AnySchema>({
  resource,
  deletionMessage = formsText.deleteConfirmationDescription(),
  deferred = false,
  component: ButtonComponent = Button.Secondary,
  onDeleted: handleDeleted,
  isIcon = false,
  children,
}: DeleteButtonProps<SCHEMA> & {
  readonly deletionMessage?: React.ReactNode;
  readonly component?: (typeof Button)['Secondary'];
  readonly onDeleted?: () => void;
  readonly isIcon?: boolean;
  // A render prop to render custom children inside the delete dialog
  readonly children?: (onClick: () => void, disabled: boolean) => JSX.Element;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);

  const { blockers, onBlockersRequested: handleBlockersRequested } =
    useDeleteBlockersForResource(resource, deferred);

  const blockerCount = useDeleteBlockerCount(resource);

  const isBlocked = blockerCount !== undefined && blockerCount > 0;

  const iconName = resource.specifyTable.name;

  // Callback for button click
  const handleClick = (): void => {
    handleOpen();
    handleBlockersRequested();
  };

  const isDisabled = blockers === undefined || isBlocked;

  return (
    <>
      {/* Use  children as render prop if provided */}
      {typeof children === 'function' ? (
        children(handleClick, isDisabled)
      ) : isIcon ? (
        <Button.Icon
          icon="trash"
          title={isBlocked ? formsText.deleteBlocked() : commonText.delete()}
          onClick={handleClick}
        />
      ) : (
        <ButtonComponent
          title={isBlocked ? formsText.deleteBlocked() : undefined}
          onClick={handleClick}
        >
          {isBlocked ? icons.exclamation : undefined}
          {commonText.delete()}
        </ButtonComponent>
      )}
      {isOpen ? (
        blockers === false ? (
          /**
           * This would be shown if the blockers aren't being fetched and aren't
           * fetched. i.e., the dialog is open but blockers are still deferred.
           * This branch should never be accessed, but just in case
           */
          <Dialog
            buttons={commonText.cancel()}
            className={{ container: dialogClassNames.narrowContainer }}
            header={mergingText.linkedRecords()}
            onClose={handleClose}
          >
            <Button.Secondary onClick={handleBlockersRequested}>
              {mergingText.linkedRecords()}
            </Button.Secondary>
          </Dialog>
        ) : // The blockers are being fetched
        blockers === undefined ? (
          <Dialog
            buttons={commonText.cancel()}
            className={{ container: dialogClassNames.narrowContainer }}
            header={commonText.loading()}
            onClose={handleClose}
          >
            {formsText.checkingIfResourceCanBeDeleted()}
            {loadingBar}
          </Dialog>
        ) : // Blockers have finished fetching and there are no blockers
        blockerCount !== undefined && blockerCount === 0 ? (
          <Dialog
            buttons={
              <>
                <Button.Danger
                  onClick={(): void => {
                    /*
                     * REFACTOR: move this into ResourceApi.js
                     */
                    overwriteReadOnly(resource, 'needsSaved', false);
                    loading(resource.destroy().then(handleDeleted));
                  }}
                >
                  {commonText.delete()}
                </Button.Danger>
                <span className="-ml-2 flex-1" />
                <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              </>
            }
            className={{
              container: dialogClassNames.narrowContainer,
            }}
            header={formsText.deleteConfirmation({
              tableName: resource.specifyTable.label,
            })}
            onClose={handleClose}
          >
            {deletionMessage}
            <div>
              <StringToJsx
                components={{
                  wrap: (
                    <i className="flex items-center gap-2">
                      <TableIcon label={false} name={iconName} />
                      <FormattedResource asLink={false} resource={resource} />
                    </i>
                  ),
                }}
                string={commonText.jsxColonLine({
                  label: treeText.resourceToDelete(),
                })}
              />
            </div>
          </Dialog>
        ) : (
          // There's one or more DeleteBlockers for the resource
          <Dialog
            buttons={commonText.close()}
            className={{
              container: dialogClassNames.wideContainer,
            }}
            header={formsText.deleteBlocked()}
            onClose={handleClose}
          >
            <DeleteBlockers blockers={blockers} />
          </Dialog>
        )
      ) : undefined}
    </>
  );
}
