import React from 'react';

import { formsText } from '../../localization/forms';
import { hijackBackboneAjax } from '../../utils/ajax/backboneAjax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Link } from '../Atoms/Link';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById } from '../DataModel/tables';
import { fieldFormat } from '../Formatters/fieldFormat';
import { format, naiveFormatter } from '../Formatters/formatters';
import { hasTablePermission } from '../Permissions/helpers';
import type { QueryFieldSpec } from './fieldSpec';
import { queryIdField } from './Results';

const needAuditLogFormatting = (fieldSpecs: RA<QueryFieldSpec>): boolean =>
  fieldSpecs.some(({ table }) =>
    ['SpAuditLog', 'SpAuditLogField'].includes(table.name)
  );

// REFACTOR: replace with <FormattedResourceUrl />
async function resourceToLink(
  table: SpecifyTable,
  id: number
): Promise<JSX.Element | string> {
  const resource = new table.Resource({ id });
  let errorHandled = false;
  return hijackBackboneAjax(
    [Http.NOT_FOUND],
    async () =>
      resource
        .fetch()
        .then(async (resource) => format(resource, undefined, true))
        .then((string) =>
          hasTablePermission(resource.specifyTable.name, 'read') &&
          !resource.isNew() ? (
            <Link.NewTab href={resource.viewUrl()}>{string}</Link.NewTab>
          ) : (
            string
          )
        ),
    (status) => {
      if (status === Http.NOT_FOUND) errorHandled = true;
    }
  ).catch((error) => {
    if (errorHandled)
      return `${naiveFormatter(table.name, id)} ${formsText.deletedInline()}`;
    else throw error;
  });
}

export function getAuditRecordFormatter(
  fieldSpecs: RA<QueryFieldSpec>
):
  | ((
      resultRow: RA<number | string | null>
    ) => Promise<RA<JSX.Element | string>>)
  | undefined {
  if (!needAuditLogFormatting(fieldSpecs)) return undefined;
  const fields = Array.from(
    fieldSpecs
      .map((fieldSpec) => fieldSpec.getField())
      .map((field) => (field?.isRelationship === false ? field : undefined))
  );

  const tableIdIndex = fields.findIndex((field) => field?.name === 'tableNum');
  if (tableIdIndex < 0) return undefined;

  const parentTableIdIndex = fields.findIndex(
    (field) => field?.name === 'parentTableNum'
  );
  if (parentTableIdIndex < 0) return undefined;

  return async (resultRow): Promise<RA<JSX.Element | string>> =>
    Promise.all(
      resultRow
        .filter((_, index) => index !== queryIdField)
        .map(async (value, index, row) => {
          if (value === null || value === '') return '';
          const stringValue = value.toString();
          if (fields[index]?.name === 'fieldName') {
            const tableId = row[tableIdIndex];
            return typeof tableId === 'number'
              ? (getTableById(tableId).getField(stringValue)?.label ??
                  stringValue)
              : (tableId ?? '');
          } else if (fields[index]?.name === 'recordId') {
            const tableId = row[tableIdIndex];
            return typeof tableId === 'number'
              ? resourceToLink(getTableById(tableId), Number(value))
              : (tableId ?? '');
          } else if (fields[index]?.name === 'parentRecordId') {
            const tableId = row[parentTableIdIndex];
            return typeof tableId === 'number'
              ? resourceToLink(getTableById(tableId), Number(value))
              : (tableId ?? '');
          } else
            return fieldFormat(
              fields[index],
              (value ?? '').toString(),
              fieldSpecs[index].parser
            );
        })
    );
}
