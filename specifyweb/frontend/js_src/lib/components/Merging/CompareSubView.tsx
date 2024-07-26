import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { mergingText } from '../../localization/merging';
import { f } from '../../utils/functools';
import type { GetOrSet, RA, RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import {
  insertItem,
  moveItem,
  removeItem,
  replaceItem,
} from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { runAllFieldChecks } from '../DataModel/businessRules';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { ResourceBase } from '../DataModel/resourceApi';
import {
  useAllSaveBlockers,
  useBlockerHandler,
} from '../DataModel/saveBlockers';
import { serializeResource } from '../DataModel/serializers';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyTable';
import { SaveButton } from '../Forms/Save';
import { FormattedResource } from '../Molecules/FormattedResource';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { resourceToGeneric } from './autoMerge';
import { MergeContainer, useMergeConformation } from './Compare';
import { CompareField, TransferButton } from './CompareField';
import { mergeCellBackground, mergeHeaderClassName } from './Header';
import { MergeDialogContainer, ToggleMergeView } from './index';

// Use this in more places?
const handleMaybeToMany = (
  dependent: Collection<AnySchema> | SpecifyResource<AnySchema>
) =>
  dependent instanceof ResourceBase
    ? [dependent as SpecifyResource<AnySchema>]
    : (dependent as Collection<AnySchema>).models;
export function MergeSubviewButton({
  relationship,
  resource,
  resources,
  merged,
}: {
  readonly relationship: Relationship;
  readonly resource: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly merged: SpecifyResource<AnySchema> | undefined;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();

  const getCount = React.useCallback(() => {
    const dependentResource = resource.getDependentResource(
      relationship.name
    ) as Collection<AnySchema> | SpecifyResource<AnySchema> | null | undefined;

    return dependentResource === undefined || dependentResource === null
      ? resource.get(relationship.name) === undefined
        ? 0
        : 1
      : handleMaybeToMany(dependentResource).length;
  }, [relationship, resource]);

  const [count, setCount] = React.useState(getCount);
  React.useEffect(
    () =>
      resourceOn(
        resource,
        `change:${relationship.name}`,
        () => setCount(getCount()),
        true
      ),
    [resource, relationship, getCount]
  );

  // If trying to save with invalid sub view, open the sub view
  useBlockerHandler(
    merged,
    relationship,
    React.useCallback(() => {
      if (!isOpen) return false;
      handleOpen();
      return true;
    }, [isOpen, handleOpen])
  );

  const blockers = useAllSaveBlockers(
    // Only get the blockers for the current resource
    merged === undefined ? resource : undefined,
    relationship
  );
  const SubviewButton =
    blockers.length === 0 ? Button.Secondary : Button.Danger;

  return (
    <>
      <SubviewButton
        aria-pressed={isOpen}
        className="flex-1"
        onClick={handleOpen}
      >
        {mergingText.nRecords({ count })}
      </SubviewButton>
      {isOpen && (
        <MergeDialog
          merged={merged ?? resource}
          relationship={relationship}
          resources={resources}
          onClose={handleClose}
        />
      )}
    </>
  );
}

function getChildren(
  resource: SpecifyResource<AnySchema>,
  relationship: Relationship
): RA<SpecifyResource<AnySchema>> {
  // Move this type to getDependentResource?
  const children = resource.getDependentResource(relationship.name) as
    | Collection<AnySchema>
    | SpecifyResource<AnySchema>
    | null
    | undefined;
  return children === null || children === undefined
    ? []
    : handleMaybeToMany(children);
}

function MergeDialog({
  relationship,
  merged,
  resources,
  onClose: handleClose,
}: {
  readonly relationship: Relationship;
  readonly merged: SpecifyResource<AnySchema>;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly onClose: () => void;
}): JSX.Element {
  const [mergedRecords, setMergedRecords] = React.useState(() =>
    getChildren(merged, relationship)
  );

  const [children, setChildren] = useChildren(
    mergedRecords,
    resources,
    relationship
  );
  const maxCount = Math.max(
    ...[mergedRecords, ...children].map((children) => children.length)
  );

  // This is ugly, but will be removed once we get rid of Backbone
  React.useEffect(() => {
    if (relationshipIsToMany(relationship))
      merged.set(relationship.name, mergedRecords as never);
    else merged.set(relationship.name, mergedRecords[0] as never);
    // TODO: optimize this
    runAllFieldChecks(merged);
  }, [merged, relationship, mergedRecords]);

  const add =
    relationshipIsToMany(relationship) || mergedRecords.length === 0 ? (
      <Button.Success
        className="flex-1"
        onClick={(): void =>
          setMergedRecords([
            ...mergedRecords,
            new relationship.relatedTable.Resource(),
          ])
        }
      >
        {commonText.add()}
      </Button.Success>
    ) : undefined;

  const [form, setForm] = React.useState<HTMLFormElement | null>(null);
  const formId = useId('merge-dialog')('form');

  return (
    <MergeDialogContainer
      buttons={
        <>
          <ToggleMergeView />
          <span className="-ml-2 flex-1" />
          {form === null ? undefined : (
            <SaveButton
              filterBlockers={relationship}
              form={form}
              label={commonText.close()}
              resource={merged}
              onSaving={(): false => {
                handleClose();
                return false;
              }}
            />
          )}
        </>
      }
      header={mergingText.mergeFields({ field: relationship.label })}
      onClose={handleClose}
    >
      <MergeContainer
        formRef={setForm}
        id={formId}
        recordCount={resources.length}
        // The save button will set a separate submit listener
        onSubmit={f.void}
      >
        <thead>
          <tr>
            <td className={mergeHeaderClassName()} />
            <th className={mergeHeaderClassName()} scope="col">
              {mergingText.mergedRecord()}
            </th>
            {resources.map((resource, index) => (
              <th className={mergeHeaderClassName()} key={index} scope="col">
                {resource === undefined ? (
                  mergingText.duplicateRecord({ index: index + 1 })
                ) : (
                  <FormattedResource resource={resource} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        {Array.from({ length: maxCount }, (_, index) => (
          <React.Fragment key={index}>
            <SubViewLine
              isFirst={index === 0 || !relationshipIsToMany(relationship)}
              isLast={
                index + 1 === maxCount || !relationshipIsToMany(relationship)
              }
              merged={mergedRecords[index]}
              mergedJsx={
                mergedRecords[index] === undefined &&
                mergedRecords[index - 1] !== undefined
                  ? add
                  : undefined
              }
              resources={children.map((record) => record[index])}
              onRemove={(): void => {
                // Could be called by the zero-to-one
                const previousMerged = Array.from(mergedRecords);
                /*
                 * If the resource isn't new, then not destroying it is fine since it will be
                 * in the collection of another resource anyways
                 */
                if (mergedRecords[index].isNew())
                  mergedRecords[index].destroy();
                setMergedRecords(removeItem(previousMerged, index));
              }}
              onSlide={(columnIndex, direction): void => {
                if (columnIndex === 0)
                  setMergedRecords(moveItem(mergedRecords, index, direction));
                else
                  setChildren(
                    replaceItem(
                      children,
                      columnIndex - 1,
                      moveItem(
                        direction === 'down' &&
                          index + 1 === children[columnIndex - 1].length
                          ? insertItem(
                              children[columnIndex - 1],
                              index + 1,
                              undefined
                            )
                          : children[columnIndex - 1],
                        index,
                        direction
                      )
                    )
                  );
              }}
            />
            <tbody>
              <tr aria-hidden>
                <td className="col-span-full my-8 border border-gray-500 !p-0" />
              </tr>
            </tbody>
          </React.Fragment>
        ))}
        {maxCount === mergedRecords.length && typeof add === 'object' ? (
          <tbody>
            <tr>
              <td />
              <td>{add}</td>
            </tr>
          </tbody>
        ) : null}
      </MergeContainer>
    </MergeDialogContainer>
  );
}

/**
 * Try to map each of the children to some of the records in the merged
 * resource (using exact match), without replacement
 */
function useChildren(
  mergedRecords: RA<SpecifyResource<AnySchema>>,
  resources: RA<SpecifyResource<AnySchema> | undefined>,
  relationship: Relationship
): GetOrSet<RA<RA<SpecifyResource<AnySchema> | undefined>>> {
  return useTriggerState(
    React.useMemo<RA<RA<SpecifyResource<AnySchema> | undefined>>>(() => {
      const children = resources.map((record) =>
        record === undefined ? undefined : getChildren(record, relationship)
      );
      const maxCount = Math.max(
        ...[mergedRecords, ...children].map((children) => children?.length ?? 0)
      );
      // Try to match duplicate children to those of merged records
      const mosaikChildren = children.map((records) =>
        records?.reduce<
          readonly [
            RR<number, SpecifyResource<AnySchema>>,
            RA<string | undefined>
          ]
        >(
          ([mappings, mergedRecords], record) => {
            const serialized = JSON.stringify(
              resourceToGeneric(serializeResource(record), true)
            );
            const matchIndex = mergedRecords.indexOf(serialized);
            return matchIndex === -1
              ? [mappings, mergedRecords]
              : [
                  { ...mappings, [matchIndex]: record },
                  replaceItem(mergedRecords, matchIndex, undefined),
                ];
          },
          [
            {},
            mergedRecords
              .map((record) =>
                resourceToGeneric(serializeResource(record), true)
              )
              .map((resource) => JSON.stringify(resource)),
          ]
        )
      );
      // Append all unmatched children at the end
      return mosaikChildren.map((results, index) => {
        if (results === undefined) return [];
        const [mappings] = results;
        const mapped = new Set(Object.values(mappings));
        return [
          ...Array.from({ length: maxCount }, (_, index) => mappings[index]),
          ...(children[index]?.filter((record) => !mapped.has(record)) ?? []),
        ];
      });
    }, [getChildren, resources, relationship])
  );
}

function SubViewLine({
  isFirst,
  isLast,
  merged,
  mergedJsx,
  resources,
  onRemove: handleRemove,
  onSlide: handleSlide,
}: {
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly merged: SpecifyResource<AnySchema> | undefined;
  readonly mergedJsx: JSX.Element | undefined;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly onRemove: () => void;
  readonly onSlide: (index: number, direction: 'down' | 'up') => void;
}): JSX.Element | null {
  const isEmpty =
    merged === undefined &&
    resources.every((resource) => resource === undefined);
  return isEmpty ? null : (
    <tbody>
      <SubViewHeader
        isFirst={isFirst}
        isLast={isLast}
        merged={merged}
        mergedJsx={mergedJsx}
        resources={resources}
        onRemove={handleRemove}
        onSlide={handleSlide}
      />
      <SubViewBody merged={merged} resources={resources} />
    </tbody>
  );
}

function SubViewHeader({
  isFirst,
  isLast,
  merged,
  mergedJsx,
  resources,
  onRemove: handleRemove,
  onSlide: handleSlide,
}: {
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly merged: SpecifyResource<AnySchema> | undefined;
  readonly mergedJsx?: JSX.Element;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
  readonly onRemove: () => void;
  readonly onSlide: (index: number, direction: 'down' | 'up') => void;
}): JSX.Element {
  return (
    <tr>
      <th className={mergeCellBackground()} scope="row">
        <span className="sr-only">{mergingText.subViewControls()}</span>
      </th>
      {[merged, ...resources].map((resource, index) =>
        resource === undefined ? (
          <td key={index}>{index === 0 ? mergedJsx : undefined}</td>
        ) : (
          <td className="!items-stretch" key={index}>
            {index === 0 ? (
              <Button.Small
                variant={className.dangerButton}
                onClick={handleRemove}
              >
                {icons.trash}
              </Button.Small>
            ) : merged === undefined ? undefined : (
              <TransferButton field={undefined} from={resource} to={merged} />
            )}
            <Button.Info
              className="flex-1"
              disabled={isFirst}
              onClick={(): void => handleSlide(index, 'up')}
            >
              {icons.chevronUp}
            </Button.Info>
            <Button.Info
              className="flex-1"
              disabled={isLast}
              onClick={(): void => handleSlide(index, 'down')}
            >
              {icons.chevronDown}
            </Button.Info>
          </td>
        )
      )}
    </tr>
  );
}

/*
 * There is an assumption that either "merged" is defined, or one of the
 * "resources" is defined.
 */
function SubViewBody({
  merged,
  resources,
}: {
  readonly merged: SpecifyResource<AnySchema> | undefined;
  readonly resources: RA<SpecifyResource<AnySchema> | undefined>;
}): JSX.Element {
  const conformation = useMergeConformation(
    filterArray([merged, ...resources])[0].specifyTable,
    React.useMemo(() => {
      const records = filterArray(resources);
      return records.length === 0 ? [merged!] : records;
    }, [resources, merged])
  );

  return (
    <>
      {conformation.map((field) => (
        <CompareField
          field={field}
          key={field.name}
          merged={merged}
          resources={resources}
        />
      ))}
    </>
  );
}
