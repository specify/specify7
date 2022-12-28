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
  hasData = true,
  isDataOpen = true,
}: {
  readonly response: JsonResponse;
  readonly hasData?: boolean;
  readonly isDataOpen?: boolean;
}): JSX.Element {
  return (
    <>
      {hasData && (
        <details open={isDataOpen === true ? true : false}>
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
      <div className="flex">
        <TableIcon name={table} label={false}></TableIcon>
        <span>{'  '}</span>
        <h2 className={className.headerPrimary}>{response.exception}</h2>
      </div>
      <div className="flex">
        <summary>{type}:</summary>
        <span>{'   '}</span>
        <em className={className.label}>{response.message}</em>
      </div>
    </>
  );
}

function formatBasicResponse(error: string): JSX.Element {
  const response = createJsonResponse(error);
  return (
    <>
      <h2 className={className.headerPrimary}>{response.exception}</h2>
      <em className={className.label}>{response.message}</em>
      <JsonBackendResponseFooter
        hasData={false}
        response={response}
      ></JsonBackendResponseFooter>
    </>
  );
}

function formatBusinessRuleException(error: string): JSX.Element {
  const response = createJsonResponse(error);
  const table: string = response.data.table;
  return (
    <>
      <BusinessRuleExceptionHeader
        table={table}
        response={response}
      ></BusinessRuleExceptionHeader>
      <JsonBackendResponseFooter
        response={response}
      ></JsonBackendResponseFooter>
    </>
  );
}

function formatTreeBusinessRuleException(error: string): JSX.Element {
  const response = createJsonResponse(error);
  const table: string = response.data.tree;
  return (
    <>
      <BusinessRuleExceptionHeader
        table={table}
        response={response}
      ></BusinessRuleExceptionHeader>
      <JsonBackendResponseFooter
        response={response}
        isDataOpen={true}
      ></JsonBackendResponseFooter>
    </>
  );
}
