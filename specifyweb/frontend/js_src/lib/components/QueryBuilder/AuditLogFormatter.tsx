import React from 'react';

import { formsText } from '../../localization/forms';
import { hijackBackboneAjax } from '../../utils/ajax/backboneAjax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { getModelById } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { format, naiveFormatter } from '../Formatters/dataObjFormatters';
import { fieldFormat } from '../Formatters/fieldFormat';
import { hasTablePermission } from '../Permissions/helpers';
import type { QueryFieldSpec } from './fieldSpec';
import { queryIdField } from './Results';

const needAuditLogFormatting = (fieldSpecs: RA<QueryFieldSpec>): boolean =>
  fieldSpecs.some(({ table }) =>
    ['SpAuditLog', 'SpAuditLogField'].includes(table.name)
  );

async function resourceToLink(
  model: SpecifyModel,
  id: number
): Promise<JSX.Element | string> {
  const resource = new model.Resource({ id });
  let errorHandled = false;
  return hijackBackboneAjax(
    [Http.OK, Http.NOT_FOUND],
    async () =>
      resource
        .fetch()
        .then(async (resource) => format(resource, undefined, true))
        .then((string) =>
          hasTablePermission(resource.specifyModel.name, 'read') ? (
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
      return `${naiveFormatter(model.name, id)} ${formsText.deletedInline()}`;
    else throw error;
  });
}

export function getAuditRecordFormatter(
  fieldSpecs: RA<QueryFieldSpec>,
  hasIdField: boolean
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

  const modelIdIndex = fields.findIndex((field) => field?.name === 'tableNum');
  if (modelIdIndex < 0) return undefined;

  const parentModelIdIndex = fields.findIndex(
    (field) => field?.name === 'parentTableNum'
  );
  if (parentModelIdIndex < 0) return undefined;

  return async (resultRow): Promise<RA<JSX.Element | string>> =>
    Promise.all(
      resultRow
        .filter((_, index) => !hasIdField || index !== queryIdField)
        .map((value, index, row) => {
          if (value === null || value === '') return '';
          const stringValue = value.toString();
          if (fields[index]?.name === 'fieldName') {
            const modelId = row[modelIdIndex];
            return typeof modelId === 'number'
              ? getModelById(modelId).getField(stringValue)?.label ??
                  stringValue
              : modelId ?? '';
          } else if (fields[index]?.name === 'recordId') {
            const modelId = row[modelIdIndex];
            return typeof modelId === 'number'
              ? resourceToLink(getModelById(modelId), Number(value))
              : modelId ?? '';
          } else if (fields[index]?.name === 'parentRecordId') {
            const modelId = row[parentModelIdIndex];
            return typeof modelId === 'number'
              ? resourceToLink(getModelById(modelId), Number(value))
              : modelId ?? '';
          } else
            return fieldFormat(
              fields[index],
              (value ?? '').toString(),
              fieldSpecs[index].parser
            );
        })
    );
}
