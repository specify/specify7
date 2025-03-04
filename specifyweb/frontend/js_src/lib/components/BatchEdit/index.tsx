import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { group, keysToLowerCase, sortFunction } from '../../utils/utils';
import { H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { dialogIcons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { idFromUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import { serializeResource } from '../DataModel/serializers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import type { SpQuery, Tables } from '../DataModel/types';
import {
  getTreeDefinitions,
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
  const [missingRanks, setMissingRanks] = React.useState<MissingRanks>();
  const [datasetName, setDatasetName] = React.useState<LocalizedString>();
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

  const handleCloseDialog = () => {
    setDatasetName(undefined);
    setMissingRanks(undefined);
  };

  const handleCreateDataset = async (newName: string) =>
    uniquifyDataSetName(newName, undefined, 'batchEdit').then(async (name) =>
      post(name).then(({ data }) => {
        handleCloseDialog();
        navigate(`/specify/workbench/${data.id}`);
      })
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

              const hasErrors = invalidFields.length > 0;
              if (hasErrors) {
                setErrors({
                  invalidFields: invalidFields.map(queryFieldSpecHeader),
                });
                return;
              }

              const newName = batchEditText.datasetName({
                queryName: query.get('name'),
                datePart: new Date().toDateString(),
              });
              const hasMissingRanks = Object.values(missingRanks).some(
                (ranks) => ranks.length > 0
              );
              if (hasMissingRanks) {
                setMissingRanks(missingRanks);
                setDatasetName(newName);
                return;
              }

              return handleCreateDataset(newName);
            })
          );
        }}
      >
        <>{batchEditText.batchEdit()}</>
      </Button.Small>
      {errors !== undefined && (
        <ErrorsDialog errors={errors} onClose={() => setErrors(undefined)} />
      )}
      {missingRanks !== undefined && datasetName !== undefined ? (
        <MissingRanksDialog
          missingRanks={missingRanks}
          onClose={handleCloseDialog}
          onContinue={async () => loading(handleCreateDataset(datasetName))}
        />
      ) : undefined}
    </>
  );
}

type QueryError = {
  readonly invalidFields: RA<string>;
};

type MissingRanks = {
  // Query can contain relationship to multiple trees
  readonly [KEY in AnyTree['tableName']]: RA<string>;
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

function findAllMissing(queryFieldSpecs: RA<QueryFieldSpec>): MissingRanks {
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

const nameExistsInRanks = (
  name: string,
  ranks: RA<SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>>
): boolean => {
  return ranks.some((rank) => rank.name === name);
};

function findMissingRanks(
  treeTable: SpecifyTable,
  treeRanks: RA<
    | { readonly rank: string; readonly field?: LiteralField | Relationship }
    | undefined
  >
): RA<string> {
  const allTreeDefItems = strictGetTreeDefinitionItems(
    treeTable.name as 'Geography',
    false,
    'all'
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

  return allTreeDefItems.flatMap(({ treeDef, rankId, name }) =>
    rankId < highestRank.specifyRank.rankId
      ? []
      : filterArray(
          requiredTreeFields.map((requiredField) => {
            const treeDefinition = getTreeDefinitions(
              treeTable.name as 'Geography',
              idFromUrl(treeDef)
            );
            const treeDefinitionName = treeDefinition[0].definition.name;

            return currentTreeRanks.some(
              (rank) =>
                (rank.specifyRank.name === name &&
                  rank.field !== undefined &&
                  requiredField === rank.field.name &&
                  rank.specifyRank.treeDef === treeDef) ||
                !nameExistsInRanks(
                  rank.specifyRank.name,
                  treeDefinition[0].ranks
                )
            )
              ? undefined
              : `${treeDefinitionName}: ${name} - ${
                  defined(
                    strictGetTable(treeTable.name).getField(requiredField)
                  ).label
                }`;
          })
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
    </Dialog>
  );
}

function MissingRanksDialog({
  missingRanks,
  onContinue: handleContinue,
  onClose: handleClose,
}: {
  readonly missingRanks: MissingRanks;
  readonly onContinue: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Info onClick={handleContinue}>
            {interactionsText.continue()}
          </Button.Info>
        </>
      }
      header={batchEditText.missingRanksInQuery()}
      icon={dialogIcons.info}
      onClose={handleClose}
    >
      <ShowMissingRanks missingRanks={missingRanks} />
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
  missingRanks,
}: {
  readonly missingRanks: MissingRanks;
}) {
  const hasMissing = Object.values(missingRanks).some(
    (rank) => rank.length > 0
  );
  return hasMissing ? (
    <div>
      <div className="mt-2 flex gap-2">
        <H2>{batchEditText.addTreeRank()}</H2>
      </div>
      {Object.entries(missingRanks).map(([treeTable, ranks]) => (
        <div>
          <div className="flex gap-2">
            <TableIcon
              label={strictGetTable(treeTable).label}
              name={treeTable}
            />
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
