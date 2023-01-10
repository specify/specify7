import React from 'react';
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
  const jsonResponse = {
    exception: json.exception,
    message: json.message,
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
          <summary>Data</summary>
          <pre>{response.formattedData}</pre>
        </details>
      )}
      <details>
        <summary>Traceback</summary>
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
  const type: string = response.data.type;
  return (
    <>
      <div className={`flex space-x-2`}>
        <TableIcon name={table} label={false} />
        <h2 className={className.headerPrimary}>{response.exception}</h2>
      </div>
      <div className={`flex space-x-2`}>
        <summary aria-label={type}>{type}:</summary>
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
