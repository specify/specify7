import React from 'react';

import { backEndText } from '../../localization/backEnd';
import { preferencesText } from '../../localization/preferences';
import { jsonStringify } from '../../utils/utils';
import { className } from '../Atoms/className';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import { TableIcon } from '../Molecules/TableIcon';

type JsonResponse = {
  readonly exception: string;
  readonly message: string;
  readonly data: any;
  readonly formattedData: string;
  readonly traceback: string;
};

function createJsonResponse(error: string): JsonResponse {
  const json = JSON.parse(error);
  const hasLocalizationKey = typeof json.data?.localizationKey === 'string';
  return {
    exception: json.exception,
    message: hasLocalizationKey
      ? resolveBackendLocalization(json)
      : json.message,
    data: json.data,
    formattedData: jsonStringify(json.data, 2),
    traceback: json.traceback,
  };
}

export function formatJsonBackendResponse(error: string): JSX.Element {
  const response = createJsonResponse(error);
  if (response.exception == 'BusinessRuleException')
    return formatBusinessRuleException(error);
  else if (response.exception == 'TreeBusinessRuleException')
    return formatTreeBusinessRuleException(error);
  else return formatBasicResponse(error);
}

/**
 *  For consistency, every backend error should contain a
 *  JsonBackendResponseFooter which optionally contains data,
 *  and always contains the traceback
 *
 *  If the backend repsonse contains additional data, then
 *  add a <details/> html element which contains the raw json response
 */
function JsonBackendResponseFooter({
  response,
  isDataOpen = true,
}: {
  readonly response: JsonResponse;
  readonly isDataOpen?: boolean;
}): JSX.Element {
  const hasData = response.data != null;
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

/**
 * If the exception is any type of BusinessRuleException,
 * include the table icon of the table which caused the exception
 */
function BusinessRuleExceptionHeader({
  table,
  response: { exception, message },
}: {
  readonly table: string;
  readonly response: JsonResponse;
}): JSX.Element {
  return (
    <>
      <div className="flex space-x-2">
        <TableIcon label={false} name={table} />
        <h2 className={className.headerPrimary}>{exception}</h2>
      </div>
      <div className="flex space-x-2">
        <em className={className.label}>{message}</em>
      </div>
    </>
  );
}

/**
 * Formats a general, non-specify specific backend error.
 */
function formatBasicResponse(error: string): JSX.Element {
  const response = createJsonResponse(error);
  return (
    <>
      <h2 className={className.headerPrimary}>{response.exception}</h2>
      <em className={className.label}>{response.message}</em>
      <JsonBackendResponseFooter isDataOpen response={response} />
    </>
  );
}

function formatBusinessRuleException(error: string): JSX.Element {
  const response = createJsonResponse(error);
  const table: string = response.data.table;
  return (
    <>
      <BusinessRuleExceptionHeader response={response} table={table} />
      <JsonBackendResponseFooter isDataOpen response={response} />
    </>
  );
}

/**
 * Currently this is identical to @see formatBusinessRuleException
 * However, each TreeBusinessRuleException in the backend is
 * consistently formatted in such a way to allow the frontend
 * to potentially stylize/format the json data in an easy to see
 * and read way
 */
function formatTreeBusinessRuleException(error: string): JSX.Element {
  const response = createJsonResponse(error);
  const table: string = response.data.tree;
  return (
    <>
      <BusinessRuleExceptionHeader response={response} table={table} />
      <JsonBackendResponseFooter isDataOpen response={response} />
    </>
  );
}

/**
 * Get the 'localizationKey' from the backend and resolve it to
 * a translated error message from the backend localization dictonary
 * If the backend has a localizationKey that the frontend can not resolve,
 * instead return the raw exception message from the backend
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
  else if (localizationKey === 'fieldNotUnique')
    return backEndText.fieldNotUnique({
      tableName: jsonResponseData.table,
      fieldName: jsonResponseData.fieldName,
    });
  else if (localizationKey === 'childFieldNotUnique')
    return backEndText.childFieldNotUnique({
      tableName: jsonResponseData.table,
      fieldName: jsonResponseData.fieldName,
      parentField: jsonResponseData.parentField,
    });
  else if (localizationKey === 'resourceInPermissionRegistry')
    return backEndText.resourceInPermissionRegistry({
      resource: jsonResponseData.resource,
    });
  else if (localizationKey === 'actorIsNotSpecifyUser')
    return backEndText.actorIsNotSpecifyUser({
      agentTable: schema.models.Agent.label,
      specifyUserTable: schema.models.SpecifyUser.label,
      actor: jsonResponseData.actor,
    });
  else if (localizationKey === 'unexpectedCollectionType')
    return backEndText.unexpectedCollectionType({
      unexpectedTypeName: jsonResponseData.unexpectedTypeName,
      collectionName: jsonResponseData.collectionName,
    });
  else if (localizationKey === 'invalidReportMimetype')
    return backEndText.invalidReportMimetype({
      mimeTypeField: getField(schema.models.SpAppResource, 'mimeType').label,
    });
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
