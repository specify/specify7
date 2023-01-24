import { f } from '../../utils/functools';
import { filterArray, RA, RR } from '../../utils/types';
import { schema } from '../DataModel/schema';
import { Tables } from '../DataModel/types';
import { AnySchema } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { mergingText } from '../../localization/merging';
import { commonText } from '../../localization/common';
import { useAsyncState } from '../../hooks/useAsyncState';
import { DeleteBlocker } from '../Forms/DeleteBlocked';
import React from 'react';
import { fetchBlockers } from '../Forms/DeleteButton';
import { MergeRow } from './Header';
import {
  getResourceApiUrl,
  strictParseResourceUrl,
} from '../DataModel/resource';
import { group, removeItem } from '../../utils/utils';
import { SpecifyModel } from '../DataModel/specifyModel';
import { Ul } from '../Atoms';
import { TableIcon } from '../Molecules/TableIcon';
import { useBooleanState } from '../../hooks/useBooleanState';
import { RecordSelectorFromIds } from '../FormSliders/RecordSelectorFromIds';
import { useTriggerState } from '../../hooks/useTriggerState';
import { Button } from '../Atoms/Button';
import { Relationship } from '../DataModel/specifyField';
import { softFail } from '../Errors/Crash';
import { error } from '../Errors/assert';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

export function UsagesSection({
  resources,
}: {
  readonly resources: RA<SpecifyResource<AnySchema>>;
}): JSX.Element {
  return (
    <MergeRow header={mergingText.referencesToRecord()}>
      <td>{commonText.notApplicable()}</td>
      {resources.map((resource, index) => (
        <Usages key={index} resource={resource} />
      ))}
    </MergeRow>
  );
}

function Usages({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const [blockers] = useAsyncState(
    React.useCallback(
      async () => fetchBlockers(resource, true).then(postProcessBlockers),
      [resource]
    ),
    false
  );
  return (
    <td className="max-h-[theme(spacing.40)] flex-col !items-start">
      {blockers === undefined ? (
        commonText.loading()
      ) : (
        <Ul className="flex flex-col gap-2">
          {blockers.map(({ tableName, ids }) => (
            <UsagesLine tableName={tableName} ids={ids} key={tableName} />
          ))}
        </Ul>
      )}
    </td>
  );
}

/**
 * I.e, if current resource depends on "LoanAgent", fetch the "Loan" record
 * instead. Same for all other child/parent tables.
 */
const postProcessBlockers = async (
  blockers: RA<DeleteBlocker>
): Promise<
  RA<{
    readonly tableName: keyof Tables;
    readonly ids: RA<number>;
  }>
> =>
  Promise.all(
    blockers.map(({ model, id }) => {
      const parentRelationship = parentTableRelationship()[model.name];
      if (parentRelationship === undefined)
        return getResourceApiUrl(model.name, id);
      return new schema.models[model.name].Resource({ id })
        .fetch()
        .then(
          (resource) =>
            resource.get(parentRelationship.name as 'createdByAgent') ??
            undefined
        );
    })
  ).then((urls) =>
    group(filterArray(f.unique(urls)).map(strictParseResourceUrl)).map(
      ([tableName, ids]) => ({ tableName, ids: ids as RA<number> })
    )
  );

/**
 * If a resource is dependent on a table not in this list, instead of showing
 * the resource, show any of the related important tables.
 *
 * For example, if Agent is used in a AccessionAgent, instead of showing
 * AccessionAgent, show Accession
 */
export const parentTableRelationship = f.store<RR<keyof Tables, Relationship>>(
  () =>
    Object.fromEntries(
      filterArray(
        Object.entries(schema.models).map(([name, table]) => {
          if (name in overrides) {
            const override = overrides[name];
            if (override === undefined) return undefined;
            else return [name, override];
          }
          /*
           * i.e, for AccessionAgent, strip the "Agent" part and check if there
           * is a table by the resulting name (i.e., Accession)
           */
          const potentialParentTable = name
            .replace(/([a-z])([A-Z])/gu, '$1 $2')
            .split(' ')
            .slice(0, -1)
            .join('');
          const relationships = table.relationships.filter(
            (relationship) =>
              relationship.relatedModel.name === potentialParentTable &&
              // For some weird reason, some relationships to parent tables are -to-many. Ignore them
              !relationshipIsToMany(relationship) &&
              relationship.name !== 'createdByAgent' &&
              relationship.name !== 'modifiedByAgent'
          );
          if (relationships.length > 1)
            softFail(
              error('Expected at most one parent relationship', {
                relationships,
                potentialParentTable,
              })
            );
          const relationship = relationships.at(0);
          if (relationship === undefined || relationshipIsToMany(relationship))
            return undefined;
          return [name, relationship];
        })
      )
    )
);

/**
 * Some exceptions are required for the above algorithm
 */
const overrides: {
  readonly [TABLE_NAME in keyof Tables]?:
    | undefined
    | keyof Tables[TABLE_NAME]['toOneIndependent'];
} = {
  BorrowReturnMaterial: 'borrowMaterial',
  CollectionObject: undefined,
  CollectionRelationship: undefined,
  Collector: 'collectingEvent',
  Determiner: 'determination',
  FieldNotebookPage: 'pageSet',
  LatLonPolygon: 'locality',
  LoanReturnPreparation: 'loanPreparation',
  InstitutionNetwork: undefined,
  PcrPerson: 'dnaSequence',
  FieldNotebookPageSet: 'fieldNotebook',
};

function UsagesLine({
  tableName,
  ids: defaultIds,
}: {
  readonly tableName: keyof Tables;
  readonly ids: RA<number>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const table = schema.models[tableName];
  const [ids, setIds] = useTriggerState(defaultIds);
  return (
    <li className="flex gap-2">
      <Button.LikeLink onClick={handleOpen}>
        <TableIcon name={tableName} label={false} />
        {commonText.countLine({
          resource: table.label,
          count: ids.length,
        })}
      </Button.LikeLink>
      {isOpen && (
        <RecordSelectorFromIds
          ids={ids}
          newResource={undefined}
          title={undefined}
          headerButtons={undefined}
          dialog="modal"
          isDependent={false}
          mode="edit"
          onClose={handleClose}
          onSaved={f.void}
          onClone={undefined}
          model={table as SpecifyModel}
          onAdd={undefined}
          onDelete={(index) => setIds(removeItem(ids, index))}
          onSlide={undefined}
          totalCount={ids.length}
        />
      )}
    </li>
  );
}

export const exportsForTests = {
  postProcessBlockers,
};
