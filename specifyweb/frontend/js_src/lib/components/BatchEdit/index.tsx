import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { batchEditText } from '../../localization/batchEdit';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import type { AnyTree } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import { serializeResource } from '../DataModel/serializers';
import type { SpQuery, Tables } from '../DataModel/types';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { userPreferences } from '../Preferences/userPreferences';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import type { QueryField } from '../QueryBuilder/helpers';
import { uniquifyDataSetName } from '../WbImport/helpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import type { MissingRanks } from './MissingRanks';
import { MissingRanksDialog } from './MissingRanks';
import { findAllMissing } from './missingRanksUtils';
import type { QueryError } from './QueryError';
import { ErrorsDialog } from './QueryError';

const queryFieldSpecHeader = (queryFieldSpec: QueryFieldSpec) =>
  generateMappingPathPreview(
    queryFieldSpec.baseTable.name,
    queryFieldSpec.toMappingPath()
  );

// Data structure for passing the treedefs to use for batch edit in case of missing ranks
type TreeDefsFilter =
  | {
      readonly [KEY in AnyTree['tableName']]: RA<number>;
    }
  | {};

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
        treeDefsFilter,
      }),
    });

  const [errors, setErrors] = React.useState<QueryError>();
  const [missingRanks, setMissingRanks] = React.useState<MissingRanks>();
  const [datasetName, setDatasetName] = React.useState<LocalizedString>();
  const [treeDefsFilter, setTreeDefsFilter] = React.useState<TreeDefsFilter>(
    {}
  );
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

  const handleCheckboxChange = (
    treeTableName: AnyTree['tableName'],
    treeDefId: number
  ) => {
    setTreeDefsFilter((previousFilter) => {
      const updatedFilter = { ...previousFilter };
      if (Array.isArray(updatedFilter[treeTableName])) {
        updatedFilter[treeTableName] = updatedFilter[treeTableName]?.includes(
          treeDefId
        )
          ? updatedFilter[treeTableName]?.filter((id) => id !== treeDefId)
          : updatedFilter[treeTableName]?.concat(treeDefId);
      } else {
        updatedFilter[treeTableName] = [treeDefId];
      }
      return updatedFilter;
    });
  };

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

  const isDisabled =
    queryFieldSpecs.some(containsSystemTables) ||
    queryFieldSpecs.some(hasHierarchyBaseTable) ||
    containsDisallowedTables(query);

  return (
    <>
      <Button.Small
        disabled={isDisabled}
        title={isDisabled ? batchEditText.batchEditDisabled() : undefined}
        onClick={() => {
          loading(
            treeRanksPromise.then(async () => {
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

              const missingRanks = findAllMissing(queryFieldSpecs);
              const newName = batchEditText.datasetName({
                queryName: query.get('name'),
                datePart: new Date().toDateString(),
              });
              const hasMissingRanks = Object.entries(missingRanks).some(
                ([_, rankData]) => Object.values(rankData).length > 0
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
          onSelectTreeDef={handleCheckboxChange}
        />
      ) : undefined}
    </>
  );
}

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

// Using tables.SpAuditLog here leads to an error in some cases where the tables data hasn't loaded correctly
const DISALLOWED_TABLES = ['spauditlog'];

const containsDisallowedTables = (query: SpecifyResource<SpQuery>) =>
  DISALLOWED_TABLES.some(
    (tableName) => query.get('contextName').toLowerCase() === tableName
  );

// Error filters
const filters = [containsFaultyNestedToMany, containsSystemTables];
