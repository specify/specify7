import React from 'react';
import { jsonStringify } from '../../utils/utils';
import { className } from '../Atoms/className';
import { TableIcon } from '../Molecules/TableIcon';

type JSONResponse = {
  exception: string;
  message: string;
  data: any;
  formattedData: string;
  traceback: string;
};

function createJsonResponse(error: string): JSONResponse {
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

export function formatJSONBackendResponse(error: string): JSX.Element {
  const response = createJsonResponse(error);
  if (response.exception == 'BusinessRuleException')
    return formatBusinessRuleException(error);
  else if (response.exception == 'TreeBusinessRuleException')
    return formatTreeBusinessRuleException(error);
  else return formatBasicResponse(error);
}

function JSONBackendResponseFooter({
  response,
  isDataOpen = true,
}: {
  readonly response: JSONResponse;
  isDataOpen?: boolean;
}): JSX.Element {
  return (
    <>
      <details open={isDataOpen === true ? true : false}>
        <summary>Data</summary>
        <pre>{response.formattedData}</pre>
      </details>
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
  readonly response: JSONResponse;
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
      <JSONBackendResponseFooter
        response={response}
      ></JSONBackendResponseFooter>
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
      <JSONBackendResponseFooter
        response={response}
      ></JSONBackendResponseFooter>
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
      <JSONBackendResponseFooter
        response={response}
        isDataOpen={false}
      ></JSONBackendResponseFooter>
    </>
  );
}
