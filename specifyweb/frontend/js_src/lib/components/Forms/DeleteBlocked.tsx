import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import type { GetSet, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { TableIcon } from '../Molecules/TableIcon';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { DateRange } from './DateRange';

export type DeleteBlocker = {
  readonly table: SpecifyTable;
  readonly blockers: RA<{
    readonly directRelationship: Relationship;
    readonly parentRelationship: Relationship | undefined;
    readonly ids: RA<{
      /*
       * Blocker might be for "Determiner", but we would resolve it to
       * "Determination" as that is a more interesting table.
       */
      readonly direct: number;
      readonly parent: number | undefined;
    }>;
  }>;
};

export function DeleteBlockers({
  resource: parentResource,
  blockers: [blockers, setBlockers],
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly blockers: GetSet<RA<DeleteBlocker>>;
}): JSX.Element {
  return (
    <Ul className="flex flex-col gap-2">
      {blockers.map((blocker, blockerIndex) => (
        <TableBlockersPreview
          blocker={blocker}
          key={blockerIndex}
          parentResource={parentResource}
          onDeleted={(relationshipIndex, resourceIndex): void =>
            setBlockers(
              /*
               * TODO: Make this smarter. The same resource can occur across relationships. If deleted
               * from one relationship, automatically delete from the other.
               */
              replaceItem(blockers, blockerIndex, {
                ...blockers[blockerIndex],
                blockers: replaceItem(
                  blockers[blockerIndex].blockers,
                  blockerIndex,
                  {
                    ...blockers[blockerIndex].blockers[relationshipIndex],
                    ids: removeItem(
                      blockers[blockerIndex].blockers[relationshipIndex].ids,
                      resourceIndex
                    ),
                  }
                ).filter(({ ids }) => ids.length > 0),
              }).filter(({ blockers }) => blockers.length > 0)
            )
          }
        />
      ))}
    </Ul>
  );
}

function TableBlockersPreview({
  blocker: { table, blockers },
  parentResource,
  onDeleted: handleDeleted,
}: {
  readonly blocker: DeleteBlocker;
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly onDeleted: (
    relationshipIndex: number,
    resourceIndex: number
  ) => void;
}): JSX.Element {
  const label = (
    <>
      <TableIcon label name={table.name} />
      {commonText.countLine({
        resource: table.label,
        count: blockers.flatMap(({ ids }) => ids).length,
      })}
    </>
  );

  return (
    <li className="flex flex-col gap-2">
      {blockers.length === 1 ? (
        <BlockerPreview
          blocker={blockers[0]}
          includeTableName
          parentResource={parentResource}
          onDeleted={(resourceIndex): void => handleDeleted(0, resourceIndex)}
        />
      ) : (
        <details>
          <summary className="list-none">
            <div className="flex items-center gap-2">{label}</div>
          </summary>
          <Ul className="flex flex-col gap-2 pl-4 pt-1">
            {blockers.map((blocker, blockerIndex) => (
              <BlockerPreview
                blocker={blocker}
                includeTableName={
                  blocker.directRelationship.table.name !== table.name
                }
                key={blockerIndex}
                nested
                parentResource={parentResource}
                onDeleted={(resourceIndex): void =>
                  handleDeleted(0, resourceIndex)
                }
              />
            ))}
          </Ul>
        </details>
      )}
    </li>
  );
}

function BlockerPreview({
  blocker: { directRelationship, parentRelationship, ids },
  parentResource,
  includeTableName,
  nested = false,
  onDeleted: handleDeleted,
}: {
  readonly blocker: DeleteBlocker['blockers'][number];
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly includeTableName: boolean;
  readonly nested?: boolean;
  readonly onDeleted: (resourceIndex: number) => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resolvedIds = React.useMemo(
    () => ids.map(({ direct, parent = direct }) => parent),
    [ids]
  );

  const table = parentRelationship?.relatedTable ?? directRelationship.table;
  const resolvedOthersideQuery = React.useMemo(() => {
    /*
     * Check if parent relationship exists. If not, optimize via direct relationship query.
     * If exists, and otherSideName is valid, optimize via other side.
     * Otherwise, default to in query
     *
     */
    const rawQueryField =
      parentRelationship === undefined
        ? QueryFieldSpec.fromPath(table.name, [
            directRelationship.name,
            directRelationship.relatedTable.idField.name,
          ])
        : parentRelationship.otherSideName === undefined
          ? undefined
          : QueryFieldSpec.fromPath(table.name, [
              parentRelationship.otherSideName,
              directRelationship.name,
              directRelationship.relatedTable.idField.name,
            ]);

    return (
      rawQueryField
        ?.toSpQueryField()
        .set('isDisplay', false)
        .set('operStart', queryFieldFilters.equal.id)
        .set('startValue', parentResource.id.toString()) ??
      QueryFieldSpec.fromPath(table.name, ['id'])
        .toSpQueryField()
        .set('isDisplay', false)
        .set('startValue', resolvedIds.join(','))
        .set('operStart', queryFieldFilters.in.id)
    );
  }, [resolvedIds]);
  return (
    <>
      <Button.LikeLink onClick={handleOpen}>
        {includeTableName && (
          <TableIcon label name={directRelationship.table.name} />
        )}
        {commonText.countLine({
          resource:
            includeTableName && !nested
              ? directRelationship.table.name
              : directRelationship.label,
          count: ids.length,
        })}
        {localized(' ')}
        <DateRange
          filterQueryField={resolvedOthersideQuery}
          ids={resolvedIds}
          table={table}
        />
      </Button.LikeLink>
      {isOpen && (
        <RecordSelectorFromIds
          defaultIndex={0}
          dialog="modal"
          headerButtons={undefined}
          ids={resolvedIds}
          isDependent={false}
          newResource={undefined}
          table={table}
          title={undefined}
          onAdd={undefined}
          onClone={undefined}
          onClose={handleClose}
          onDelete={handleDeleted}
          onSaved={(resource): void => {
            if (
              parentRelationship === undefined &&
              resource.get(directRelationship.name) !==
                parentResource.get('resource_uri')
            )
              handleDeleted(resolvedIds.indexOf(resource.id));
            handleClose();
          }}
          onSlide={undefined}
        />
      )}
    </>
  );
}
