import { f } from '../../utils/functools';
import { filterArray, RA, RR, ValueOf } from '../../utils/types';
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
      const replacementTable = tableReplacements()[model.name];
      if (replacementTable === undefined)
        return getResourceApiUrl(model.name, id);
      const parentRelationships = findParentRelationships(
        model,
        schema.models[replacementTable]
      );
      if (parentRelationships.length !== 1)
        throw new Error('Expected one parent relationship');
      return new schema.models[model.name].Resource({ id })
        .fetch()
        .then(
          (resource) =>
            resource.get(parentRelationships[0].name as 'createdByAgent') ??
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
const tableReplacements = f.store<RR<keyof Tables, keyof Tables>>(() =>
  Object.fromEntries(
    filterArray(
      Object.keys(schema.models).map((name) => {
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
        if (potentialParentTable in schema.models)
          return [name, potentialParentTable as keyof Tables];
        else return undefined;
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
    // Only allow tables that have an independent -to-one relationship with the parent
    | (Exclude<ValueOf<Tables[TABLE_NAME]['toOneIndependent']>, null> &
        AnySchema)['tableName'];
} = {
  BorrowReturnMaterial: 'BorrowMaterial',
  CollectionObject: undefined,
  CollectionRelationship: undefined,
  Collector: 'CollectingEvent',
  Determiner: 'Determination',
  FieldNotebookPage: 'FieldNotebookPageSet',
  LatLonPolygon: 'Locality',
  LoanReturnPreparation: 'LoanPreparation',
  InstitutionNetwork: undefined,
  PcrPerson: 'DNASequence',
};

/**
 * There should only be one, but returning all of them so that tests can
 * report that case as a bug
 */
const findParentRelationships = (
  { relationships }: SpecifyModel,
  parentModel: SpecifyModel
) =>
  relationships.filter(
    ({ relatedModel, name }) =>
      relatedModel === parentModel &&
      name !== 'createdByAgent' &&
      name !== 'modifiedByAgent'
  );

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
  tableReplacements,
  findParentRelationships,
  postProcessBlockers,
};
