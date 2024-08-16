import React from 'react';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { GeographyTreeDefItem, SpQuery, Tables } from '../DataModel/types';
import { Button } from '../Atoms/Button';
import { useNavigate } from 'react-router-dom';
import { keysToLowerCase } from '../../utils/utils';
import { serializeResource } from '../DataModel/serializers';
import { ajax } from '../../utils/ajax';
import { QueryField } from '../QueryBuilder/helpers';
import { defined, filterArray, localized, RA } from '../../utils/types';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { batchEditText } from '../../localization/batchEdit';
import { uniquifyDataSetName } from '../WbImport/helpers';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { State } from 'typesafe-reducer';
import { isNestedToMany } from '../WbPlanView/modelHelpers';
import { LocalizedString } from 'typesafe-i18n';
import {strictGetTreeDefinitionItems, treeRanksPromise } from '../InitialContext/treeRanks';
import { SerializedResource } from '../DataModel/helperTypes';
import { f } from '../../utils/functools';
import { LoadingContext } from '../Core/Contexts';
import { commonText } from '../../localization/common';
import { Dialog } from '../Molecules/Dialog';
import { formatConjunction } from '../Atoms/Internationalization';
import { dialogIcons } from '../Atoms/Icons';
import { userPreferences } from '../Preferences/userPreferences';


export function BatchEdit({
  query,
  fields,
  baseTableName,
}: {
  readonly query: SpecifyResource<SpQuery>;
  readonly fields: RA<QueryField>;
  readonly baseTableName: keyof Tables
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
          limit: userPreferences.get('batchEdit', 'query', 'limit')
        }),
    });
  const [errors, setErrors] = React.useState<RA<Invalid>>([]);
  const loading = React.useContext(LoadingContext);
  return (
    <>
    <Button.Small
      onClick={() => {
        loading(
          treeRanksPromise.then(()=>{
            const queryFieldSpecs = fields.map((field)=>[field.isDisplay, QueryFieldSpec.fromPath(baseTableName, field.mappingPath)] as const);
            const visibleSpecs = filterArray(queryFieldSpecs.map((item)=>item[0] ? item[1] : undefined));
            // Need to only perform checks on display fields, but need to use line numbers from the original query.
            const newErrors = filterArray(queryFieldSpecs.flatMap(([isDisplay, fieldSpec], index)=>isDisplay ? validators.map((callback)=>f.maybe(callback(fieldSpec, visibleSpecs), (reason)=>({type: 'Invalid', reason, line: index} as const))) : []));
            if (newErrors.length > 0){
              setErrors(newErrors);
              return;
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
    {errors.length > 0 && <ErrorsDialog errors={errors} onClose={()=>setErrors([])}/>}
    </>
  );
}


type Invalid = State<"Invalid", {readonly line: number, readonly reason: LocalizedString}>;

type ValidatorItem = (queryField: QueryFieldSpec, allQueryFields: RA<QueryFieldSpec>) => undefined | LocalizedString;

const validators: RA<ValidatorItem> = [containsFaultyNestedToMany, containsFaultyTreeRelationships]

function containsFaultyNestedToMany(queryField: QueryFieldSpec, allQueryFields: RA<QueryFieldSpec>) : undefined | LocalizedString;
function containsFaultyNestedToMany(queryField: QueryFieldSpec) : undefined | LocalizedString {
  const joinPath = queryField.joinPath
  if (joinPath.length <= 1) return undefined;
  const hasNestedToMany = joinPath.some((currentField, id)=>{
    const nextField = joinPath[id+1];
    return nextField !== undefined && currentField.isRelationship && nextField.isRelationship && isNestedToMany(currentField, nextField);
  });
  return hasNestedToMany ? batchEditText.containsNestedToMany() : undefined
} 

const getTreeDefFromName = (rankName: string, treeDefItems: RA<SerializedResource<GeographyTreeDefItem>>)=>defined(treeDefItems.find((treeRank)=>treeRank.name.toLowerCase() === rankName.toLowerCase()));

function containsFaultyTreeRelationships(queryField: QueryFieldSpec, allQueryFields: RA<QueryFieldSpec>) : undefined | LocalizedString {
  if (queryField.treeRank === undefined) return undefined; // no treee ranks, nothing to check.
  const otherTreeRanks = filterArray(allQueryFields.map((fieldSpec)=>fieldSpec.treeRank));
  const treeDefItems = strictGetTreeDefinitionItems(queryField.table.name as "Geography", false);
  const currentRank = defined(getTreeDefFromName(queryField.treeRank, treeDefItems));
  const isHighest = otherTreeRanks.every((item)=>getTreeDefFromName(item, treeDefItems).rankId >= currentRank.rankId);
  if (!isHighest) return undefined; // To not possibly duplicate the error multiple times
  const missingRanks = treeDefItems.filter((item)=>item.rankId > currentRank.rankId);
  if (missingRanks.length !== 0) return 
  return batchEditText.missingRanks({rankJoined: formatConjunction(missingRanks.map((item)=>localized(item.title ?? '')))})
}

function ErrorsDialog({errors, onClose: handleClose}:{readonly errors: RA<Invalid>; readonly onClose: ()=>void }): JSX.Element {
  return <Dialog buttons={commonText.close()} header={batchEditText.errorInQuery()} icon={dialogIcons.error} onClose={handleClose}>
    {errors.map((error, index)=><div key={index}>{error.line+1} {error.reason}</div>)}
  </Dialog>
}