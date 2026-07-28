import type { LocalizedString } from 'typesafe-i18n';

import { backEndText } from '../../localization/backEnd';
import type { IR, RA, RR } from '../../utils/types';
import { localized } from '../../utils/types';
import {
  formatConjunction,
  formatDisjunction,
} from '../Atoms/Internationalization';
import { getField } from '../DataModel/helpers';
import { getTable, tables } from '../DataModel/tables';

type PayloadMessageResolver = (payload: IR<unknown>) => LocalizedString;

type BusinessRuleMessageResolver = (
  payload: IR<unknown>
) => LocalizedString | undefined;

export const backendParsingMessageResolvers: RR<string, PayloadMessageResolver> = {
  failedParsingBoolean: (payload): LocalizedString =>
    backEndText.failedParsingBoolean({ value: payload.value as string }),
  failedParsingDecimal: (payload): LocalizedString =>
    backEndText.failedParsingDecimal({ value: payload.value as string }),
  failedParsingFloat: (payload): LocalizedString =>
    backEndText.failedParsingFloat({ value: payload.value as string }),
  failedParsingAgentType: (payload): LocalizedString =>
    backEndText.failedParsingAgentType({
      agentTypeField: getField(tables.Agent, 'agentType').label,
      badType: payload.badType as string,
      validTypes: formatDisjunction(
        (payload.validTypes as RA<LocalizedString>) ?? []
      ),
    }),
  valueTooLong: (payload): LocalizedString =>
    backEndText.valueTooLong({
      maxLength: payload.maxLength as number,
    }),
  invalidYear: (payload): LocalizedString =>
    backEndText.invalidYear({
      value: payload.value as string,
    }),
  badDateFormat: (payload): LocalizedString =>
    backEndText.badDateFormat({
      value: payload.value as string,
      format: payload.format as string,
    }),
  coordinateBadFormat: (payload): LocalizedString =>
    backEndText.coordinateBadFormat({
      value: payload.value as string,
    }),
  latitudeOutOfRange: (payload): LocalizedString =>
    backEndText.latitudeOutOfRange({
      value: payload.value as string,
    }),
  longitudeOutOfRange: (payload): LocalizedString =>
    backEndText.longitudeOutOfRange({
      value: payload.value as string,
    }),
  formatMismatch: (payload): LocalizedString =>
    backEndText.formatMismatch({
      value: payload.value as string,
      formatter: payload.formatter as string,
    }),
};

export function resolveBackendParsingMessage(
  key: string,
  payload: IR<unknown>
): LocalizedString | undefined {
  const resolver = backendParsingMessageResolvers[key];
  return resolver?.(payload);
}

function withConflictingRecordIds(
  message: LocalizedString,
  payload: IR<unknown>
): LocalizedString {
  const conflicting = payload.conflicting;
  const conflictingIds = Array.isArray(conflicting)
    ? conflicting
        .filter(
          (value): value is string | number =>
            typeof value === 'string' || typeof value === 'number'
        )
        .map((value) => String(value))
    : [];
  return conflictingIds.length > 0
    ? localized(
        `${message} (${backEndText.conflictingRecordIds({
          ids: conflictingIds.join(', '),
        })})`
      )
    : message;
}

function getStringPayload(payload: IR<unknown>, key: string): string {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

function getObjectPayload(payload: IR<unknown>, key: string): IR<unknown> {
  const value = payload[key];
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as IR<unknown>)
    : {};
}

function getNestedStringPayload(
  payload: IR<unknown>,
  key: string,
  nestedKey: string
): string {
  return getStringPayload(getObjectPayload(payload, key), nestedKey);
}

function getSchemaTableLabel(tableName: string): LocalizedString {
  return getTable(tableName)?.label ?? localized(tableName);
}

function getSchemaFieldLabel(
  tableName: string,
  fieldName: string
): LocalizedString {
  const lookupFieldName = fieldName.split('__').join('.');
  return (
    getTable(tableName)?.getField(lookupFieldName)?.label ??
    localized(fieldName)
  );
}

function getSchemaFieldLabels(
  tableName: string,
  fieldNames: string
): LocalizedString {
  const labels = fieldNames
    .split(',')
    .map((fieldName) => fieldName.trim())
    .filter((fieldName) => fieldName.length > 0)
    .map((fieldName) => getSchemaFieldLabel(tableName, fieldName));
  return labels.length === 0
    ? localized(fieldNames)
    : formatConjunction(labels);
}

export const businessRuleMessageResolvers: RR<string, BusinessRuleMessageResolver> = {
  fieldNotUnique: (payload): LocalizedString | undefined => {
    const tableName = getStringPayload(payload, 'table');
    const fieldName = getStringPayload(payload, 'fieldName');
    if (tableName.length === 0 || fieldName.length === 0) return undefined;
    return withConflictingRecordIds(
      backEndText.fieldNotUnique({
        tableName: getSchemaTableLabel(tableName),
        fieldName: getSchemaFieldLabels(tableName, fieldName),
      }),
      payload
    );
  },
  childFieldNotUnique: (payload): LocalizedString | undefined => {
    const tableName = getStringPayload(payload, 'table');
    const fieldName = getStringPayload(payload, 'fieldName');
    const parentField = getStringPayload(payload, 'parentField');
    if (
      tableName.length === 0 ||
      fieldName.length === 0 ||
      parentField.length === 0
    )
      return undefined;
    return withConflictingRecordIds(
      backEndText.childFieldNotUnique({
        tableName: getSchemaTableLabel(tableName),
        fieldName: getSchemaFieldLabels(tableName, fieldName),
        parentField: getSchemaFieldLabels(tableName, parentField),
      }),
      payload
    );
  },
  badTreeStructureInvalidRanks: (payload): LocalizedString =>
    backEndText.badTreeStructureInvalidRanks({
      badRanks: Number(payload.badRanks) || 0,
    }),
  deletingTreeRoot: (): LocalizedString => backEndText.deletingTreeRoot(),
  nodeParentInvalidRank: (): LocalizedString => backEndText.nodeParentInvalidRank(),
  nodeChildrenInvalidRank: (): LocalizedString =>
    backEndText.nodeChildrenInvalidRank(),
  nodeOperationToSynonymizedParent: (payload): LocalizedString =>
    backEndText.nodeOperationToSynonymizedParent({
      operation: getStringPayload(payload, 'operation'),
      nodeName: getNestedStringPayload(payload, 'node', 'fullName'),
      parentName: getNestedStringPayload(payload, 'parent', 'fullName'),
    }),
  nodeSynonymizeToSynonymized: (payload): LocalizedString =>
    backEndText.nodeSynonymizeToSynonymized({
      nodeName: getNestedStringPayload(payload, 'node', 'fullName'),
      intoName: getNestedStringPayload(payload, 'synonymized', 'fullName'),
    }),
  nodeSynonimizeWithChildren: (payload): LocalizedString =>
    backEndText.nodeSynonimizeWithChildren({
      nodeName: getNestedStringPayload(payload, 'parent', 'fullName'),
    }),
  invalidNodeType: (payload): LocalizedString =>
    backEndText.invalidNodeType({
      node: `${payload.node ?? ''}`,
      operation: getStringPayload(payload, 'operation'),
      nodeModel: getStringPayload(payload, 'nodeModel'),
    }),
  operationAcrossTrees: (payload): LocalizedString =>
    backEndText.operationAcrossTrees({
      operation: getStringPayload(payload, 'operation'),
    }),
  limitReachedDeterminingAccepted: (payload): LocalizedString =>
    backEndText.limitReachedDeterminingAccepted({
      taxonId: Number(payload.taxonId) || 0,
    }),
  resourceInPermissionRegistry: (payload): LocalizedString =>
    backEndText.resourceInPermissionRegistry({
      resource: getStringPayload(payload, 'resource'),
    }),
  actorIsNotSpecifyUser: (payload): LocalizedString =>
    backEndText.actorIsNotSpecifyUser({
      agentTable: tables.Agent.label,
      specifyUserTable: tables.SpecifyUser.label,
      actor: getStringPayload(payload, 'actor'),
    }),
  unexpectedCollectionType: (payload): LocalizedString =>
    backEndText.unexpectedCollectionType({
      unexpectedTypeName: getStringPayload(payload, 'unexpectedTypeName'),
      collectionName: getStringPayload(payload, 'collectionName'),
    }),
  invalidReportMimetype: (): LocalizedString =>
    backEndText.invalidReportMimetype({
      mimeTypeField: getField(tables.SpAppResource, 'mimeType').label,
    }),
  fieldNotRelationship: (payload): LocalizedString =>
    backEndText.fieldNotRelationship({
      field: getStringPayload(payload, 'field'),
    }),
  unexpectedTableId: (payload): LocalizedString =>
    backEndText.unexpectedTableId({
      tableId: `${payload.tableId ?? ''}`,
      expectedTableId: `${payload.expectedTableId ?? ''}`,
    }),
  noCollectionInQuery: (payload): LocalizedString =>
    backEndText.noCollectionInQuery({
      table: getStringPayload(payload, 'table'),
    }),
  invalidDatePart: (payload): LocalizedString =>
    backEndText.invalidDatePart({
      datePart: getStringPayload(payload, 'datePart'),
      validDateParts: getStringPayload(payload, 'validDateParts'),
    }),
  invalidUploadStatus: (payload): LocalizedString =>
    backEndText.invalidUploadStatus({
      uploadStatus: `${payload.uploadStatus ?? ''}`,
      operation: getStringPayload(payload, 'operation'),
      expectedUploadStatus: getStringPayload(payload, 'expectedUploadStatus'),
    }),
  datasetAlreadyUploaded: (): LocalizedString =>
    backEndText.datasetAlreadyUploaded(),
};

export function resolveBackendBusinessRuleMessage(
  key: string,
  payload: IR<unknown>
): LocalizedString | undefined {
  const localizationKey = getStringPayload(payload, 'localizationKey') || key;
  if (localizationKey.length === 0) return undefined;

  const resolver = businessRuleMessageResolvers[localizationKey];
  return resolver?.(payload);
}

export const validationMessageResolvers: RR<string, PayloadMessageResolver> = {
  failedParsingPickList: (payload): LocalizedString =>
    backEndText.failedParsingPickList({
      value: `"${payload.value as string}"`,
    }),
  pickListValueTooLong: (payload): LocalizedString =>
    backEndText.pickListValueTooLong({
      pickListTable: tables.PickList.label,
      pickList: payload.pickList as string,
      maxLength: payload.maxLength as number,
    }),
  invalidPartialRecord: (payload): LocalizedString =>
    backEndText.invalidPartialRecord({
      column: payload.column as string,
    }),
  fieldRequiredByUploadPlan: (): LocalizedString =>
    backEndText.fieldRequiredByUploadPlan(),
  invalidTreeStructure: (): LocalizedString => backEndText.invalidTreeStructure(),
  scopeChangeError: (): LocalizedString => backEndText.scopeChangeDetected(),
  multipleTreeDefsInRow: (): LocalizedString =>
    backEndText.multipleTreeDefsInRow(),
  invalidCotype: (): LocalizedString => backEndText.invalidCotype(),
  invalidComponentType: (): LocalizedString =>
    backEndText.invalidComponentType({
      componentType: tables.Component.field.type.label,
    }),
  missingRequiredTreeParent: (payload): LocalizedString =>
    backEndText.missingRequiredTreeParent({
      names: formatConjunction((payload.names as RA<LocalizedString>) ?? []),
    }),
};

export function resolveSpecificValidationMessage(
  key: string,
  payload: IR<unknown>
): LocalizedString | undefined {
  const resolver = validationMessageResolvers[key];
  return resolver?.(payload);
}

export const attachmentValidationMessageResolvers: RR<
  string,
  () => LocalizedString
> = {
  attachmentNotFound: (): LocalizedString => backEndText.attachmentNotFound(),
  tableDoesNotSupportAttachments: (): LocalizedString =>
    backEndText.tableDoesNotSupportAttachments(),
  attachmentAlreadyLinked: (): LocalizedString =>
    backEndText.attachmentAlreadyLinked(),
};

export function resolveAttachmentValidationMessageByKey(
  key: string
): LocalizedString {
  return attachmentValidationMessageResolvers[key]?.() ??
    backEndText.attachmentNotFound();
}
