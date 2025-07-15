import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { ajax } from '../../utils/ajax';
import type { DeepPartial, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import type { AnyTree } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import { serializeResource } from '../DataModel/serializers';
import type { SpQuery, Tables } from '../DataModel/types';
import { isTreeTable, treeRanksPromise } from '../InitialContext/treeRanks';
import { Dialog } from '../Molecules/Dialog';
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
  saveRequired,
  recordSetId,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly baseTableName: keyof Tables;
  readonly saveRequired: boolean;
  readonly recordSetId?: number;
}) {
  const hasRelationships = userPreferences.get(
    'batchEdit',
    'editor',
    'enableRelationships'
  );

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
        omitRelationships: !hasRelationships,
      }),
    });

  const [errors, setErrors] = React.useState<QueryError>();
  const [missingRanks, setMissingRanks] = React.useState<MissingRanks>();
  const [datasetName, setDatasetName] = React.useState<LocalizedString>();
  const [treeDefsFilter, setTreeDefsFilter] = React.useState<TreeDefsFilter>(
    {}
  );
  const [showWarningDialog, openWarningDialog, closeWarningDialog] =
    useBooleanState();
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

  const handleClickBatchEdit = () =>
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

  return (
    <>
      <Button.Small
        disabled={isDisabled}
        title={isDisabled ? batchEditText.batchEditDisabled() : undefined}
        onClick={() => {
          if (saveRequired || query.needsSaved) openWarningDialog();
          else handleClickBatchEdit();
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
      {showWarningDialog && (
        <Dialog
          buttons={
            <Button.Danger onClick={closeWarningDialog}>
              {commonText.close()}
            </Button.Danger>
          }
          header={queryText.unsavedChangesInQuery()}
          onClose={closeWarningDialog}
        >
          {queryText.unsavedChangesInQueryDescription()}
        </Dialog>
      )}
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

  const isTreeOnlyQuery =
    isTreeTable(queryFieldSpec.baseTable.name) &&
    isTreeTable(queryFieldSpec.table.name);

  const allowedToMany = isTreeOnlyQuery ? 0 : 1;
  return nestedToManyCount.length > allowedToMany;
}

const containsSystemTables = (queryFieldSpec: QueryFieldSpec) =>
  queryFieldSpec.joinPath.some((field) => field.table.isSystem);

const DISALLOWED_FIELDS: DeepPartial<{
  readonly [TABLE in keyof Tables]: RA<keyof Tables[TABLE]['fields']>;
}> = {
  /*
   * FEATURE: Remove these when lat/long is officially supported
   * See https://github.com/specify/specify7/issues/6251 and
   * https://github.com/specify/specify7/issues/6655
   */
  Locality: [
    'latitude1',
    'longitude1',
    'lat1text',
    'long1text',
    'latitude2',
    'longitude2',
    'lat2text',
    'long2text',
  ],
};

function containsDisallowedFields(queryFieldSpec: QueryFieldSpec) {
  const field = queryFieldSpec.getField();
  if (
    field === undefined ||
    field.isRelationship ||
    DISALLOWED_FIELDS[field.table.name] === undefined
  )
    return false;
  return (
    DISALLOWED_FIELDS[field.table.name]?.includes(field.name as never) ?? false
  );
}

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
const filters: RA<(queryFieldSpec: QueryFieldSpec) => boolean> = [
  containsFaultyNestedToMany,
  containsSystemTables,
  containsDisallowedFields,
];
