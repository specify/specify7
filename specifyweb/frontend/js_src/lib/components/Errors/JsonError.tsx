import React from 'react';
import { backEndText } from '../../localization/backEnd';
import { preferencesText } from '../../localization/preferences';
import { jsonStringify } from '../../utils/utils';
import { className } from '../Atoms/className';
import { TableIcon } from '../Molecules/TableIcon';

type JsonResponse = {
  exception: string;
  message: string;
  data: any;
  formattedData: string;
  traceback: string;
};

function createJsonResponse(error: string): JsonResponse {
  const json = JSON.parse(error);
  const hasLocalizationKey =
    json.data.localizationKey == undefined ? false : true;
  const jsonResponse = {
    exception: json.exception,
    message: hasLocalizationKey
      ? resolveBackendLocalization(json)
      : json.message,
    data: json.data,
    formattedData: jsonStringify(json.data, 2),
    traceback: json.traceback,
  };
  return jsonResponse;
}

export function formatJsonBackendResponse(error: string): JSX.Element {
  const response = createJsonResponse(error);
  if (response.exception == 'BusinessRuleException')
    return formatBusinessRuleException(error);
  else if (response.exception == 'TreeBusinessRuleException')
    return formatTreeBusinessRuleException(error);
  else return formatBasicResponse(error);
}

function JsonBackendResponseFooter({
  response,
  isDataOpen = true,
}: {
  readonly response: JsonResponse;
  readonly isDataOpen?: boolean;
}): JSX.Element {
  const hasData = response.data == null ? false : true;
  return (
    <>
      {hasData && (
        <details open={isDataOpen}>
          <summary>{preferencesText.content()}</summary>
          <pre>{response.formattedData}</pre>
        </details>
      )}
      <details>
        <summary>{backEndText.showTraceback()}</summary>
        <pre>{response.traceback}</pre>
      </details>
    </>
  );
}

function BusinessRuleExceptionHeader({
  table,
  response,
}: {
  readonly table: string;
  readonly response: JsonResponse;
}): JSX.Element {
  return (
    <>
      <div className={`flex space-x-2`}>
        <TableIcon name={table} label={false} />
        <h2 className={className.headerPrimary}>{response.exception}</h2>
      </div>
      <div className={`flex space-x-2`}>
        <em className={className.label} title={response.message}>
          {response.message}
        </em>
      </div>
    </>
  );
}

function formatBasicResponse(error: string): JSX.Element {
  const response = createJsonResponse(error);
  return (
    <>
      <h2 className={className.headerPrimary}>{response.exception}</h2>
      <em className={className.label} title={response.message}>
        {response.message}
      </em>
      <JsonBackendResponseFooter isDataOpen={true} response={response} />
    </>
  );
}

function formatBusinessRuleException(error: string): JSX.Element {
  const response = createJsonResponse(error);
  const table: string = response.data.table;
  return (
    <>
      <BusinessRuleExceptionHeader table={table} response={response} />
      <JsonBackendResponseFooter response={response} />
    </>
  );
}

function formatTreeBusinessRuleException(error: string): JSX.Element {
  const response = createJsonResponse(error);
  const table: string = response.data.tree;
  return (
    <>
      <BusinessRuleExceptionHeader table={table} response={response} />
      <JsonBackendResponseFooter response={response} isDataOpen={true} />
    </>
  );
}

/**
 *
 * @param jsonResponseData
 * @returns
 */
function resolveBackendLocalization(jsonResponseData: any): string {
  const localizationKey: string = jsonResponseData.localizationKey;
  if (localizationKey === 'badTreeStructureInvalidRanks')
    return backEndText.badTreeStructureInvalidRanks({
      badRanks: jsonResponseData.badRanks,
    });
  else if (localizationKey === 'deletingTreeRoot')
    return backEndText.deletingTreeRoot();
  else if (localizationKey === 'nodeParentInvalidRank')
    return backEndText.nodeParentInvalidRank();
  else if (localizationKey === 'nodeChildrenInvalidRank')
    return backEndText.nodeChildrenInvalidRank();
  else if (localizationKey === 'nodeOperationToSynonymizedParent')
    return backEndText.nodeOperationToSynonymizedParent({
      operation: jsonResponseData.operation,
      nodeName: jsonResponseData.node.fullName,
      parentName: jsonResponseData.parent.fullName,
    });
  else if (localizationKey === 'nodeSynonymizeToSynonymized')
    return backEndText.nodeSynonymizeToSynonymized({
      nodeName: jsonResponseData.node.fullName,
      intoName: jsonResponseData.synonymized.fullName,
    });
  else if (localizationKey === 'nodeSynonimizeWithChildren')
    return backEndText.nodeSynonimizeWithChildren({
      nodeName: jsonResponseData.parent.fullName,
    });
  else if (localizationKey === 'invalidNodeType')
    return backEndText.invalidNodeType({
      node: jsonResponseData.node,
      operation: jsonResponseData.operation,
      nodeModel: jsonResponseData.nodeModel,
    });
  else if (localizationKey === 'mergeAcrossTrees')
    return backEndText.mergeAcrossTrees();
  else if (localizationKey === 'synonymizeAcrossTrees')
    return backEndText.synonymizeAcrossTrees();
  else if (localizationKey === 'limitReachedDeterminingAccepted')
    return backEndText.limitReachedDeterminingAccepted({
      taxonId: jsonResponseData.taxonId,
    });
  else if (localizationKey === 'resourceInPermissionRegistry')
    return backEndText.resourceInPermissionRegistry({
      resource: jsonResponseData.resource,
    });
  else if (localizationKey === 'actorIsNotSpecifyUser')
    return backEndText.actorIsNotSpecifyUser({ actor: jsonResponseData.actor });
  else if (localizationKey === 'unexpectedCollectionType')
    return backEndText.unexpectedCollectionType({
      unexpectedTypeName: jsonResponseData.unexpectedTypeName,
      collectionName: jsonResponseData.collectionName,
    });
  else if (localizationKey === 'invalidReportMimetype')
    return backEndText.invalidReportMimetype();
  else if (localizationKey === 'fieldNotRelationship')
    return backEndText.fieldNotRelationship({ field: jsonResponseData.field });
  else if (localizationKey === 'unexpectedTableId')
    return backEndText.unexpectedTableId({
      tableId: jsonResponseData.tableId,
      expectedTableId: jsonResponseData.expectedTableId,
    });
  else if (localizationKey === 'noCollectionInQuery')
    return backEndText.noCollectionInQuery({ table: jsonResponseData.table });
  else if (localizationKey === 'invalidDatePart')
    return backEndText.invalidDatePart({
      datePart: jsonResponseData.datePart,
      validDateParts: jsonResponseData.validDateParts,
    });
  else if (localizationKey === 'invalidUploadStatus')
    return backEndText.invalidUploadStatus({
      uploadStatus: jsonResponseData,
      operation: jsonResponseData.operation,
      expectedUploadStatus: jsonResponseData.expectedUploadStatus,
    });
  else if (localizationKey === 'datasetAlreadyUploaded')
    return backEndText.datasetAlreadyUploaded();
  else return jsonResponseData.message;
}
