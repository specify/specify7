import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { runQuery } from '../../utils/ajax/specifyApi';
import type { RA } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { strictGetModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { loadingBar } from '../Molecules';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { createQuery } from '../QueryBuilder';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import type { DeleteBlocker } from './DeleteBlocked';
import { DeleteBlockers } from './DeleteBlocked';
import { parentTableRelationship } from './parentTables';

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
            {deletionMessage}
          </Dialog>
        ) : (
          <Dialog
            buttons={commonText.close()}
            className={{
              container: dialogClassNames.wideContainer,
            }}
            header={formsText.deleteBlocked()}
            onClose={handleClose}
          >
            {formsText.deleteBlockedDescription()}
            <DeleteBlockers
              blockers={blockers}
              resource={resource}
              onCleared={(): void => setBlockers([])}
            />
          </Dialog>
        )
      ) : undefined}
    </>
  );
}

export const fetchBlockers = async (
  resource: SpecifyResource<AnySchema>,
  expectFailure: boolean = false
): Promise<RA<DeleteBlocker>> =>
  ajax<
    RA<{
      readonly table: keyof Tables;
      readonly field: string;
      readonly ids: RA<number>;
    }>
  >(
    `/api/delete_blockers/${resource.specifyModel.name.toLowerCase()}/${
      resource.id
    }/`,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
      expectedErrors: expectFailure ? [Http.NOT_FOUND] : [],
    }
  ).then(({ data, status }) =>
    status === Http.NOT_FOUND
      ? []
      : Promise.all(
          data.map(async ({ ids, field, table: tableName }) => {
            const table = strictGetModel(tableName);
            const directRelationship = table.strictGetRelationship(field);
            const parentRelationship =
              parentTableRelationship()[directRelationship.model.name];
            return {
              directRelationship,
              parentRelationship,
              ids:
                parentRelationship === undefined
                  ? ids.map((id) => ({
                      direct: id,
                      parent: undefined,
                    }))
                  : await runQuery<readonly [number, number]>(
                      serializeResource(
                        createQuery(
                          'Delete blockers',
                          directRelationship.model
                        ).set('fields', [
                          QueryFieldSpec.fromPath(
                            directRelationship.model.name,
                            [directRelationship.model.idField.name]
                          )
                            .toSpQueryField()
                            .set('isDisplay', false)
                            .set('operStart', queryFieldFilters.in.id)
                            .set('startValue', ids.join(',')),
                          QueryFieldSpec.fromPath(
                            parentRelationship.model.name,
                            [
                              parentRelationship.name,
                              parentRelationship.relatedModel.idField.name,
                            ]
                          ).toSpQueryField(),
                        ])
                      ),
                      {
                        limit: 0,
                      }
                    ).then((rows) =>
                      rows.map(([direct, parent]) => ({
                        direct,
                        parent,
                      }))
                    ),
            };
          })
        )
  );
