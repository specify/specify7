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
import { Submit } from '../Atoms/Submit';
import { serializeResource } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyModel';
import type { Accession } from '../DataModel/types';
import { FormattedResource } from '../Molecules/FormattedResource';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { resourceToGeneric } from './autoMerge';
import { MergeContainer, useMergeConformation } from './Compare';
import { CompareField, MergeButton } from './CompareField';
import { mergeCellBackground, mergeHeaderClassName } from './Header';
import { MergeDialogContainer, ToggleMergeView } from './index';

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
  const getCount = React.useCallback(
    () =>
      relationshipIsToMany(relationship)
        ? (resource as SpecifyResource<Accession>).getDependentResource(
            relationship.name as 'accessionAgents'
          )?.models.length ?? 0
        : resource.get(relationship.name) === undefined
        ? 0
        : 1,
    [relationship, resource]
  );
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

  const [isValid, setValid] = React.useState(true);
  React.useEffect(() => {
    if (merged !== undefined) return;
    const relationshipName = relationship.relatedModel.name;
    resourceOn(
      resource,
      'blockersChanged',
      () => {
        const hasSaveBlocker = Array.from(
          resource.saveBlockers?.blockingResources ?? []
        )
          .map((resource) => resource.specifyModel.name)
          .includes(relationshipName);
        setValid(!hasSaveBlocker);
      },
      true
    );
  }, [resource]);

  const SubviewButton = isValid ? Button.BorderedGray : Button.Danger;

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
  const id = useId('merge-dialog');

  const getChildren = React.useCallback(
    (resource: SpecifyResource<AnySchema>) => {
      const children = resource.getDependentResource(relationship.name);
      return relationshipIsToMany(relationship)
        ? (children as Collection<AnySchema> | undefined)?.models ?? []
        : filterArray([children]);
    },
    [relationship]
  );

  const [mergedRecords, setMergedRecords] = React.useState(() =>
    getChildren(merged)
  );

  const [children, setChildren] = useChildren(
    mergedRecords,
    getChildren,
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
  }, [merged, relationship, mergedRecords]);

  const add =
    relationshipIsToMany(relationship) || mergedRecords.length === 0 ? (
      <Button.Success
        className="flex-1"
        onClick={(): void =>
          setMergedRecords([
            ...mergedRecords,
            new relationship.relatedModel.Resource(),
          ])
        }
      >
        {commonText.add()}
      </Button.Success>
    ) : undefined;

  return (
    <MergeDialogContainer
      buttons={
        <>
          <ToggleMergeView />
          <span className="-ml-2 flex-1" />
          <Submit.Gray form={id('form')}>{commonText.close()}</Submit.Gray>
        </>
      }
      header={mergingText.mergeFields({ field: relationship.label })}
      onClose={handleClose}
    >
      <MergeContainer
        id={id('form')}
        recordCount={resources.length}
        onSubmit={handleClose}
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
                mergedRecords[index].destroy();
                setMergedRecords(removeItem(mergedRecords, index));
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
  getChildren: (
    resource: SpecifyResource<AnySchema>
  ) => RA<SpecifyResource<AnySchema>>,
  resources: RA<SpecifyResource<AnySchema> | undefined>,
  relationship: Relationship
): GetOrSet<RA<RA<SpecifyResource<AnySchema> | undefined>>> {
  return useTriggerState(
    React.useMemo<RA<RA<SpecifyResource<AnySchema> | undefined>>>(() => {
      const children = resources.map((record) => f.maybe(record, getChildren));
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
              <MergeButton field={undefined} from={resource} to={merged} />
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
    filterArray([merged, ...resources])[0].specifyModel,
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
