import React from 'react';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { GeographyTreeDefItem, SpQuery, Tables } from '../DataModel/types';
import { Button } from '../Atoms/Button';
import { useNavigate } from 'react-router-dom';
import { keysToLowerCase, sortFunction, group } from '../../utils/utils';
import { serializeResource } from '../DataModel/serializers';
import { ajax } from '../../utils/ajax';
import { QueryField } from '../QueryBuilder/helpers';
import { defined, filterArray,  RA } from '../../utils/types';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { batchEditText } from '../../localization/batchEdit';
import { uniquifyDataSetName } from '../WbImport/helpers';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import {isTreeTable, strictGetTreeDefinitionItems, treeRanksPromise } from '../InitialContext/treeRanks';
import { AnyTree, SerializedResource } from '../DataModel/helperTypes';
import { f } from '../../utils/functools';
import { LoadingContext } from '../Core/Contexts';
import { commonText } from '../../localization/common';
import { Dialog } from '../Molecules/Dialog';
import { dialogIcons } from '../Atoms/Icons';
import { userPreferences } from '../Preferences/userPreferences';
import { SpecifyTable } from '../DataModel/specifyTable';
import { H2, H3 } from '../Atoms';
import { TableIcon } from '../Molecules/TableIcon';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { strictGetTable } from '../DataModel/tables';

export function BatchEditFromQuery({
  query,
  fields,
  baseTableName,
  recordSetId
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly baseTableName: keyof Tables;
  readonly recordSetId?: number
}) {
  const navigate = useNavigate();
  const post = (dataSetName: string) =>
    ajax<{ id: number }>('/stored_query/batch_edit/', {
      method: 'POST',
      errorMode: 'dismissible',
      headers: { Accept: 'application/json' },
      body: keysToLowerCase(
        {
          ...serializeResource(query), 
          captions: fields.filter(({isDisplay})=>isDisplay).map(({mappingPath})=>generateMappingPathPreview(baseTableName, mappingPath)),
          name: dataSetName,
          recordSetId,
          limit: userPreferences.get('batchEdit', 'query', 'limit')
        }),
    });
  const [errors, setErrors] = React.useState<QueryError|undefined>(undefined);
  const loading = React.useContext(LoadingContext);
  return (
    <>
    <Button.Small
      onClick={() => {
        loading(
          treeRanksPromise.then(()=>{
            const queryFieldSpecs = filterArray(fields.map((field)=>field.isDisplay ? QueryFieldSpec.fromPath(baseTableName, field.mappingPath) : undefined));
            const missingRanks = findAllMissing(queryFieldSpecs);
            const invalidFields = filterArray(queryFieldSpecs.map(containsFaultyNestedToMany));

            const hasErrors = (Object.values(missingRanks).some((ranks)=>ranks.length > 0) || (invalidFields.length > 0));

            if (hasErrors) {
              setErrors({missingRanks, invalidFields});
              return
            } 

            const newName = batchEditText.datasetName({queryName: query.get('name'), datePart: new Date().toDateString()});
            return uniquifyDataSetName(newName, undefined, 'batchEdit').then((name)=>post(name).then(({ data }) => navigate(`/specify/workbench/${data.id}`)))
          })
        )
      }
    }
    >
      <>{batchEditText.batchEdit()}</>
    </Button.Small>
    {errors !== undefined && <ErrorsDialog errors={errors} onClose={()=>setErrors(undefined)}/>}
    </>
  );
}

type QueryError = {
  readonly missingRanks: {
    // Query can contain relationship to multiple trees
    readonly [KEY in AnyTree['tableName']]: RA<string>
  },
  readonly invalidFields: RA<string>
};

function containsFaultyNestedToMany(queryFieldSpec: QueryFieldSpec) : undefined | string {
  const joinPath = queryFieldSpec.joinPath
  if (joinPath.length <= 1) return undefined;
  const nestedToManyCount = joinPath.filter((relationship)=>relationship.isRelationship && relationshipIsToMany(relationship));
  return nestedToManyCount.length > 1 ? (generateMappingPathPreview(queryFieldSpec.baseTable.name, queryFieldSpec.toMappingPath())) : undefined
} 

const getTreeDefFromName = (rankName: string, treeDefItems: RA<SerializedResource<GeographyTreeDefItem>>)=>defined(treeDefItems.find((treeRank)=>treeRank.name.toLowerCase() === rankName.toLowerCase()));

function findAllMissing(queryFieldSpecs: RA<QueryFieldSpec>): QueryError['missingRanks'] {
  const treeFieldSpecs = group(queryFieldSpecs.filter((fieldSpec)=>isTreeTable(fieldSpec.table.name)).map((spec)=>[spec.table, spec.treeRank]));
  return Object.fromEntries(treeFieldSpecs.map(([treeTable, treeRanks])=>[treeTable.name, findMissingRanks(treeTable, treeRanks)]))
}

function findMissingRanks(treeTable: SpecifyTable, treeRanks: RA<undefined|string>) {
  if (treeRanks.every((rank)=>(rank === undefined))) {};

  const allTreeDefItems = strictGetTreeDefinitionItems(treeTable.name as "Geography", false);

  // Duplicates don't affect any logic here
  const currentTreeRanks = filterArray(treeRanks.map((treeRank)=>f.maybe(treeRank, (name)=>getTreeDefFromName(name, allTreeDefItems))));

  const currentRanksSorted = [...currentTreeRanks].sort(sortFunction(({rankId})=>rankId, true));

  const highestRank = currentRanksSorted[0];

  const ranksBelow = allTreeDefItems.filter(({rankId, name})=>rankId > highestRank.rankId && !currentTreeRanks.find((rank)=>rank.name === name));

  return ranksBelow.map((rank)=>rank.name)
}

function ErrorsDialog({errors, onClose: handleClose}:{readonly errors: QueryError; readonly onClose: ()=>void }): JSX.Element {
  return <Dialog buttons={commonText.close()} header={batchEditText.errorInQuery()} icon={dialogIcons.error} onClose={handleClose}>
      <ShowInvalidFields error={errors.invalidFields} />
      <ShowMissingRanks error={errors.missingRanks}/>
  </Dialog>
}

function ShowInvalidFields({error}: {readonly error: QueryError['invalidFields']}){
  const hasErrors = error.length > 0;
  return hasErrors ? <div><div><H2>{batchEditText.removeField()}</H2></div>{error.map((singleError)=><H3>{singleError}</H3>)}</div> : null
}
 
function ShowMissingRanks({error}: {readonly error: QueryError['missingRanks']}) {
  const hasMissing = Object.values(error).some((rank)=>rank.length > 0);
  return hasMissing ? <div><div className='flex gap-2 mt-2'><H2>{batchEditText.addTreeRank()}</H2></div>{Object.entries(error).map(([treeTable, ranks])=><div><div><TableIcon label name={treeTable}/><H2>{strictGetTable(treeTable).label}</H2></div><div>{ranks.map((rank)=><H3>{rank}</H3>)}</div></div>)}</div> : null
}