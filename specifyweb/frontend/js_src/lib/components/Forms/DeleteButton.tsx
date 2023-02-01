import React from 'react';

import { ajax } from '../../utils/ajax';
import type { Tables } from '../DataModel/types';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { strictGetModel } from '../DataModel/schema';
import type { RA } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import type { DeleteBlocker } from './DeleteBlocked';
import { DeleteBlocked } from './DeleteBlocked';
import { icons } from '../Atoms/Icons';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useLiveState } from '../../hooks/useLiveState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { AnySchema } from '../DataModel/helperTypes';
import { loadingBar } from '../Molecules';
import { treeText } from '../../localization/tree';
import { FormattedResource } from '../Molecules/FormattedResource';
import { StringToJsx } from '../../localization/utils';

const fetchBlockers = async (
  resource: SpecifyResource<AnySchema>
): Promise<RA<DeleteBlocker>> =>
  ajax<
    RA<{
      readonly table: keyof Tables;
      readonly field: string;
      readonly id: number;
    }>
  >(
    `/api/delete_blockers/${resource.specifyModel.name.toLowerCase()}/${
      resource.id
    }/`,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
    }
  ).then(({ data }) =>
    data.map(({ table, ...rest }) => ({
      ...rest,
      model: strictGetModel(table),
    }))
  );

/**
 * A button to delele a resorce
 * Prompts before deletion
 * Checks for delete blockers (other resources depending on this one) before
 * deletion
 */
export function DeleteButton<SCHEMA extends AnySchema>({
  resource,
  deletionMessage = formsText.deleteConfirmationDescription(),
  deferred: initialDeferred = false,
  component: ButtonComponent = Button.Gray,
  onDeleted: handleDeleted,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly deletionMessage?: React.ReactNode;
  /**
   * As a performance optimization, can defer checking for delete blockers
   * until the button is clicked. This is used in the tree viewer as delete
   * button's resource can change often.
   */
  readonly deferred?: boolean;
  readonly component?: typeof Button['Gray'];
  readonly onDeleted?: () => void;
}): JSX.Element {
  const [deferred, setDeferred] = useLiveState<boolean>(
    React.useCallback(() => initialDeferred, [initialDeferred, resource])
  );
  const [blockers, setBlockers] = useAsyncState<RA<DeleteBlocker>>(
    React.useCallback(
      async () => (deferred ? undefined : fetchBlockers(resource)),
      [resource, deferred]
    ),
    false
  );

  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);

  const isBlocked = Array.isArray(blockers) && blockers.length > 0;

  return (
    <>
      <ButtonComponent
        title={isBlocked ? formsText.deleteBlocked() : undefined}
        onClick={(): void => {
          handleOpen();
          setDeferred(false);
        }}
      >
        {isBlocked ? icons.exclamation : undefined}
        {commonText.delete()}
      </ButtonComponent>
      {isOpen ? (
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
        ) : blockers.length === 0 ? (
          <Dialog
            buttons={
              <>
                <Button.Red
                  onClick={(): void => {
                    /*
                     * REFACTOR: move this into ResourceApi.js
                     */
                    overwriteReadOnly(resource, 'needsSaved', false);
                    loading(resource.destroy().then(handleDeleted));
                  }}
                >
                  {commonText.delete()}
                </Button.Red>
                <span className="-ml-2 flex-1" />
                <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              </>
            }
            className={{
              container: dialogClassNames.narrowContainer,
            }}
            header={formsText.deleteConfirmation({
              tableName: resource.specifyModel.label,
            })}
            onClose={handleClose}
          >
            {deletionMessage}{' '}
            <StringToJsx
              components={{
                wrap: (
                  <i>
                    <FormattedResource resource={resource} asLink={false} />
                  </i>
                ),
              }}
              string={commonText.jsxColonLine({
                label: treeText.resourceToDelete(),
              })}
            />
          </Dialog>
        ) : (
          <DeleteBlocked
            blockers={blockers}
            resource={resource}
            onClose={handleClose}
            onDeleted={(): void => setBlockers([])}
          />
        )
      ) : undefined}
    </>
  );
}
