import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { treeText } from '../../localization/tree';
import { StringToJsx } from '../../localization/utils';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import { group } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import type { Relationship } from '../DataModel/specifyField';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { loadingBar } from '../Molecules';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { FormattedResource } from '../Molecules/FormattedResource';
import { TableIcon } from '../Molecules/TableIcon';
import { createQuery } from '../QueryBuilder';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { runQuery } from '../QueryBuilder/ResultsWrapper';
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
  component: ButtonComponent = Button.Secondary,
  onDeleted: handleDeleted,
  isIcon = false,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly deletionMessage?: React.ReactNode;
  /**
   * As a performance optimization, can defer checking for delete blockers
   * until the button is clicked. This is used in the tree viewer as delete
   * button's resource can change often.
   */
  readonly deferred?: boolean;
  readonly component?: typeof Button['Secondary'];
  readonly onDeleted?: () => void;
  readonly isIcon?: boolean;
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

  const iconName = resource.specifyTable.name;

  return (
    <>
      {isIcon ? (
        <Button.Icon
          icon="trash"
          title={isBlocked ? formsText.deleteBlocked() : commonText.delete()}
          onClick={(): void => {
            handleOpen();
            setDeferred(false);
          }}
        />
      ) : (
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
      )}
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
              blockers={[blockers, setBlockers]}
              resource={resource}
            />
          </Dialog>
        )
      ) : undefined}
    </>
  );
}

function resolveParentViaOtherside(
  parentRelationship: Relationship,
  directRelationship: Relationship,
  id: number
) {
  const baseTable = parentRelationship.relatedTable;
  return createQuery('Delete blockers', baseTable).set('fields', [
    QueryFieldSpec.fromPath(baseTable.name, [
      baseTable.idField.name,
    ]).toSpQueryField(),
    QueryFieldSpec.fromPath(baseTable.name, [
      parentRelationship.otherSideName!,
      directRelationship.name,
      directRelationship.relatedTable.idField.name,
    ])
      .toSpQueryField()
      .set('isDisplay', false)
      .set('operStart', queryFieldFilters.equal.id)
      .set('startValue', id.toString()),
  ]);
}

export async function fetchBlockers(
  resource: SpecifyResource<AnySchema>,
  expectFailure: boolean = false
): Promise<RA<DeleteBlocker>> {
  const { data, status } = await ajax<
    RA<{
      readonly table: keyof Tables;
      readonly field: string;
      readonly ids: RA<number>;
    }>
  >(
    `/api/delete_blockers/${resource.specifyTable.name.toLowerCase()}/${
      resource.id
    }/`,
    {
      headers: { Accept: 'application/json' },
      expectedErrors: expectFailure ? [Http.NOT_FOUND] : [],
    }
  );
  if (status === Http.NOT_FOUND) return [];

  const blockersPromise = data.map(async ({ ids, field, table: tableName }) => {
    const table = strictGetTable(tableName);
    const directRelationship = table.strictGetRelationship(field);
    const parentRelationship =
      parentTableRelationship()[directRelationship.table.name];
    return [
      parentRelationship?.relatedTable ?? directRelationship.table,
      {
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
                  /*
                   * TODO: Check if this is possible.
                   */
                  parentRelationship.otherSideName === undefined
                    ? createQuery(
                        'Delete blockers',
                        directRelationship.table
                      ).set('fields', [
                        QueryFieldSpec.fromPath(directRelationship.table.name, [
                          directRelationship.table.idField.name,
                        ])
                          .toSpQueryField()
                          .set('isDisplay', false)
                          .set('operStart', queryFieldFilters.in.id)
                          .set('startValue', ids.join(',')),
                        /*
                         * TODO: ParentRelationship.model.name should always be directRelationship.model.name.
                         * Check if that can never be the case
                         */
                        QueryFieldSpec.fromPath(
                          parentRelationship.relatedTable.name,
                          [
                            parentRelationship.name,
                            parentRelationship.relatedTable.idField.name,
                          ]
                        ).toSpQueryField(),
                      ])
                    : resolveParentViaOtherside(
                        parentRelationship,
                        directRelationship,
                        resource.id
                      )
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
      },
    ] as const;
  });
  const blockers = await Promise.all(blockersPromise);
  return group(blockers).map(([table, blockers]) => ({ table, blockers }));
}
