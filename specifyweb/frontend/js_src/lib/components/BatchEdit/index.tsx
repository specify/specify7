import React from 'react';
import { useNavigate } from 'react-router-dom';

import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { group, keysToLowerCase, sortFunction } from '../../utils/utils';
import { H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { dialogIcons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import type { AnyTree, FilterTablesByEndsWith, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import { serializeResource } from '../DataModel/serializers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import type { SpQuery, Tables } from '../DataModel/types';
import {
  isTreeTable,
  strictGetTreeDefinitionItems,
  treeRanksPromise,
} from '../InitialContext/treeRanks';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { userPreferences } from '../Preferences/userPreferences';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import type { QueryField } from '../QueryBuilder/helpers';
import { uniquifyDataSetName } from '../WbImport/helpers';
import {
  anyTreeRank,
  relationshipIsToMany,
} from '../WbPlanView/mappingHelpers';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';

const queryFieldSpecHeader = (queryFieldSpec: QueryFieldSpec) =>
  generateMappingPathPreview(
    queryFieldSpec.baseTable.name,
    queryFieldSpec.toMappingPath()
  );

export function BatchEditFromQuery({
  query,
  fields,
  baseTableName,
  recordSetId,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly baseTableName: keyof Tables;
  readonly recordSetId?: number;
}) {
  const navigate = useNavigate();
  const post = async (dataSetName: string) =>
    ajax<{ readonly id: number }>('/stored_query/batch_edit/', {
      method: 'POST',
      errorMode: 'dismissible',
      headers: { Accept: 'application/json' },
      body: keysToLowerCase({
        ...serializeResource(query),
        captions: fields
          .filter(({ isDisplay }) => isDisplay)
          .map(({ mappingPath }) =>
            generateMappingPathPreview(baseTableName, mappingPath)
          ),
        name: dataSetName,
        recordSetId,
        limit: userPreferences.get('batchEdit', 'query', 'limit'),
      }),
    });
  const [errors, setErrors] = React.useState<QueryError | undefined>(undefined);
  const loading = React.useContext(LoadingContext);

  const queryFieldSpecs = React.useMemo(
    () =>
      filterArray(
        fields.map((field) =>
          field.isDisplay
            ? QueryFieldSpec.fromPath(baseTableName, field.mappingPath)
            : undefined
        )
      ),
    [fields]
  );

  return (
    <>
      <Button.Small
        disabled={
          queryFieldSpecs.some(containsSystemTables) ||
          queryFieldSpecs.some(hasHierarchyBaseTable)
        }
        onClick={() => {
          loading(
            treeRanksPromise.then(async () => {
              const missingRanks = findAllMissing(queryFieldSpecs);
              const invalidFields = queryFieldSpecs.filter((fieldSpec) =>
                filters.some((filter) => filter(fieldSpec))
              );
              const hasErrors =
                Object.values(missingRanks).some((ranks) => ranks.length > 0) ||
                invalidFields.length > 0;

              if (hasErrors) {
                setErrors({
                  missingRanks,
                  invalidFields: invalidFields.map(queryFieldSpecHeader),
                });
                return;
              }

              const newName = batchEditText.datasetName({
                queryName: query.get('name'),
                datePart: new Date().toDateString(),
              });
              return uniquifyDataSetName(newName, undefined, 'batchEdit').then(
                async (name) =>
                  post(name).then(({ data }) =>
                    navigate(`/specify/workbench/${data.id}`)
                  )
              );
            })
          );
        }}
      >
        <>{batchEditText.batchEdit()}</>
      </Button.Small>
      {errors !== undefined && (
        <ErrorsDialog errors={errors} onClose={() => setErrors(undefined)} />
      )}
    </>
  );
}

type QueryError = {
  readonly missingRanks: {
    readonly // Query can contain relationship to multiple trees
    [KEY in AnyTree['tableName']]: RA<string>;
  };
  readonly invalidFields: RA<string>;
};

function containsFaultyNestedToMany(queryFieldSpec: QueryFieldSpec): boolean {
  const joinPath = queryFieldSpec.joinPath;
  if (joinPath.length <= 1) return false;
  const nestedToManyCount = joinPath.filter(
    (relationship) =>
      relationship.isRelationship && relationshipIsToMany(relationship)
  );
  return nestedToManyCount.length > 1;
}

const containsSystemTables = (queryFieldSpec: QueryFieldSpec) =>
  queryFieldSpec.joinPath.some((field) => field.table.isSystem);

const hasHierarchyBaseTable = (queryFieldSpec: QueryFieldSpec) =>
  Object.keys(schema.domainLevelIds).includes(
    queryFieldSpec.baseTable.name.toLowerCase() as 'collection'
  );

const filters = [containsFaultyNestedToMany, containsSystemTables];

const getTreeDefFromName = (
  rankName: string,
  treeDefItems: RA<SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>>
) =>
  defined(
    treeDefItems.find(
      (treeRank) => treeRank.name.toLowerCase() === rankName.toLowerCase()
    )
  );

function findAllMissing(
  queryFieldSpecs: RA<QueryFieldSpec>
): QueryError['missingRanks'] {
  const treeFieldSpecs = group(
    filterArray(
      queryFieldSpecs.map((fieldSpec) =>
        isTreeTable(fieldSpec.table.name) &&
        fieldSpec.treeRank !== anyTreeRank &&
        fieldSpec.treeRank !== undefined
          ? [
              fieldSpec.table,
              { rank: fieldSpec.treeRank, field: fieldSpec.getField() },
            ]
          : undefined
      )
    )
  );

  return Object.fromEntries(
    treeFieldSpecs.map(([treeTable, treeRanks]) => [
      treeTable.name,
      findMissingRanks(treeTable, treeRanks),
    ])
  );
}

// TODO: discuss if we need to add more of them, and if we need to add more of them for other table.
const requiredTreeFields: RA<keyof AnyTree['fields']> = ['name'] as const;

function findMissingRanks(
  treeTable: SpecifyTable,
  treeRanks: RA<
    | { readonly rank: string; readonly field?: LiteralField | Relationship }
    | undefined
  >
): RA<string> {
  const allTreeDefItems = strictGetTreeDefinitionItems(
    treeTable.name as 'Geography',
    false
  );

  // Duplicates don't affect any logic here
  const currentTreeRanks = filterArray(
    treeRanks.map((treeRank) =>
      f.maybe(treeRank, ({ rank, field }) => ({
        specifyRank: getTreeDefFromName(rank, allTreeDefItems),
        field,
      }))
    )
  );

  const currentRanksSorted = Array.from(currentTreeRanks).sort(
    sortFunction(({ specifyRank: { rankId } }) => rankId)
  );

  const highestRank = currentRanksSorted[0];

  return allTreeDefItems.flatMap(({ rankId, name }) =>
    rankId < highestRank.specifyRank.rankId
      ? []
      : filterArray(
          requiredTreeFields.map((requiredField) =>
            currentTreeRanks.some(
              (rank) =>
                rank.specifyRank.name === name &&
                rank.field !== undefined &&
                requiredField === rank.field.name
            )
              ? undefined
              : `${name} ${
                  defined(
                    strictGetTable(treeTable.name).getField(requiredField)
                  ).label
                }`
          )
        )
  );
}

function ErrorsDialog({
  errors,
  onClose: handleClose,
}: {
  readonly errors: QueryError;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={commonText.close()}
      header={batchEditText.errorInQuery()}
      icon={dialogIcons.error}
      onClose={handleClose}
    >
      <ShowInvalidFields error={errors.invalidFields} />
      <ShowMissingRanks error={errors.missingRanks} />
    </Dialog>
  );
}

function ShowInvalidFields({
  error,
}: {
  readonly error: QueryError['invalidFields'];
}) {
  const hasErrors = error.length > 0;
  return hasErrors ? (
    <div>
      <div>
        <H2>{batchEditText.removeField()}</H2>
      </div>
      {error.map((singleError) => (
        <H3>{singleError}</H3>
      ))}
    </div>
  ) : null;
}

function ShowMissingRanks({
  error,
}: {
  readonly error: QueryError['missingRanks'];
}) {
  const hasMissing = Object.values(error).some((rank) => rank.length > 0);
  return hasMissing ? (
    <div>
      <div className="mt-2 flex gap-2">
        <H2>{batchEditText.addTreeRank()}</H2>
      </div>
      {Object.entries(error).map(([treeTable, ranks]) => (
        <div>
          <div>
            <TableIcon label name={treeTable} />
            <H2>{strictGetTable(treeTable).label}</H2>
          </div>
          <div>
            {ranks.map((rank) => (
              <H3>{rank}</H3>
            ))}
          </div>
        </div>
      ))}
    </div>
  ) : null;
}
