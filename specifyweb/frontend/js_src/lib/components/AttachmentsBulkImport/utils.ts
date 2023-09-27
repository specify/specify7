import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import {
  insertItem,
  keysToLowerCase,
  mappedFind,
  replaceItem,
} from '../../utils/utils';
import { addMissingFields } from '../DataModel/addMissingFields';
import { deserializeResource, serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import type { UiFormatter } from '../Forms/uiFormatters';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { makeQueryField } from '../QueryBuilder/fromTree';
import type { AttachmentUploadSpec } from './Import';
import { AttachmentMapping, staticAttachmentImportPaths } from './importPaths';
import type {
  AttachmentStatus,
  CanDelete,
  CanUpload,
  PartialUploadableFileSpec,
  UnBoundFile,
} from './types';
import { formatterTypeMapper } from '../Forms/uiFormatters';
import { State } from 'typesafe-reducer';
import { formsText } from '../../localization/forms';

const isAttachmentMatchValid = (uploadSpec: PartialUploadableFileSpec) =>
  uploadSpec.matchedId !== undefined &&
  (uploadSpec.matchedId.length === 1 || uploadSpec.disambiguated !== undefined);

export type ResolvedAttachmentRecord =
  | State<
      'invalid' | 'valid',
      { readonly reason: keyof typeof keyLocalizationMapAttachment }
    >
  | State<'matched', { readonly id: number }>;

const resolveAttachmentMatch = (
  matchedId: RA<number>,
  disambiguated: number | undefined
): ResolvedAttachmentRecord =>
  matchedId.length === 0
    ? { type: 'invalid', reason: 'noMatch' }
    : matchedId.length > 1 && disambiguated === undefined
    ? {
        type: 'invalid',
        reason: 'multipleMatches',
      }
    : {
        type: 'matched',
        id: disambiguated ?? matchedId[0],
      };
export function resolveAttachmentRecord(
  matchedId: RA<number> | undefined,
  disambiguated: number | undefined,
  parsedName: string | undefined
): ResolvedAttachmentRecord {
  if (parsedName === undefined)
    return { type: 'invalid', reason: 'incorrectFormatter' };
  if (matchedId === undefined)
    return { type: 'valid', reason: 'correctlyFormatted' };
  return resolveAttachmentMatch(matchedId, disambiguated);
}

const findFirstReason =
  (
    conditions: (uploadSpec: PartialUploadableFileSpec) => RA<boolean>,
    humanReasons: RA<keyof typeof keyLocalizationMapAttachment>
  ) =>
  (uploadSpec: PartialUploadableFileSpec) => {
    const resolvedConditions = conditions(uploadSpec);
    return mappedFind(resolvedConditions, (condition, index) =>
      condition ? undefined : humanReasons[index]
    );
  };

const uploadHumanReasons: RA<keyof typeof keyLocalizationMapAttachment> = [
  'alreadyUploaded',
  'noFile',
  'incorrectFormatter',
  'matchError',
];

const deleteHumanReasons: RA<keyof typeof keyLocalizationMapAttachment> = [
  'noAttachments',
  'matchError',
];
export const reasonToSkipUpload = findFirstReason(
  (uploadSpec) => [
    uploadSpec.attachmentId === undefined,
    uploadSpec.file instanceof File,
    uploadSpec.file.parsedName !== undefined,
    isAttachmentMatchValid(uploadSpec),
  ],
  uploadHumanReasons
);

export const reasonToSkipDelete = findFirstReason(
  (uploadSpec) => [
    uploadSpec.attachmentId !== undefined,
    isAttachmentMatchValid(uploadSpec),
  ],
  deleteHumanReasons
);

export const canUploadAttachment = (
  uploadSpec: PartialUploadableFileSpec
): uploadSpec is CanUpload => reasonToSkipUpload(uploadSpec) === undefined;

export const canDeleteAttachment = (
  uploadSpec: PartialUploadableFileSpec
): uploadSpec is CanDelete =>
  uploadSpec.attachmentId !== undefined && isAttachmentMatchValid(uploadSpec);

function generateInQueryResource(
  baseTable: keyof Tables,
  path: string,
  searchableList: RA<number | string | undefined>,
  queryName: string,
  additionalPaths: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  > = []
): SpecifyResource<SpQuery> {
  const rawFields = [
    ...additionalPaths,
    {
      path,
      isDisplay: true,
      operStart: queryFieldFilters.in.id,
      startValue: filterArray(searchableList).join(','),
    },
  ];
  const queryField = rawFields.map(({ path, ...field }, index) =>
    serializeResource(
      makeQueryField(baseTable, path, { ...field, position: index })
    )
  );
  return deserializeResource(
    addMissingFields('SpQuery', {
      name: queryName,
      contextName: baseTable,
      contextTableId: schema.models[baseTable].tableId,
      countOnly: false,
      fields: queryField,
    })
  );
}

export async function validateAttachmentFiles(
  uploadableFiles: RA<PartialUploadableFileSpec>,
  uploadSpec: AttachmentUploadSpec,
  keepDisambiguation: boolean = false
): Promise<RA<PartialUploadableFileSpec>> {
  const { baseTable, path } =
    staticAttachmentImportPaths[uploadSpec.staticPathKey];

  const validationQueryResource = generateInQueryResource(
    baseTable,
    path,
    uploadableFiles.map(({ file }) => file?.parsedName),
    'Batch Attachment Upload'
  );
  const validationResponse = (
    await validationPromiseGenerator(validationQueryResource)
  )
    .map(({ targetId, restResult }) => ({
      targetId,
      rawResult: uploadSpec.formatQueryResults(restResult[0]),
    }))
    .filter((result) => result.rawResult !== undefined);

  return matchFileSpec(
    uploadableFiles,
    validationResponse as RA<{
      readonly targetId: number;
      readonly rawResult: string;
    }>,
    keepDisambiguation
  );
}

export function matchSelectedFiles(
  previousUploadables: RA<PartialUploadableFileSpec>,
  filesToResolve: RA<PartialUploadableFileSpec>
): RA<PartialUploadableFileSpec> {
  let resolvedFiles = previousUploadables;
  filesToResolve.forEach((uploadable) => {
    const matchedIndex = resolvedFiles.findIndex((previousUploadable) => {
      if (
        previousUploadable.attachmentId !== undefined ||
        previousUploadable.file instanceof File
      )
        return false;

      return (
        previousUploadable.file !== undefined &&
        previousUploadable.file.name === uploadable.file.name &&
        previousUploadable.file.size === uploadable.file.size &&
        previousUploadable.file.type === uploadable.file.type
      );
    });

    resolvedFiles =
      matchedIndex === -1
        ? insertItem(resolvedFiles, resolvedFiles.length, uploadable)
        : replaceItem(resolvedFiles, matchedIndex, {
            ...resolvedFiles[matchedIndex],
            file: uploadable.file,
            /*
             * Generating tokens again because the file could have been
             * uploaded to the asset server but not yet recorded in Specify DB.
             */
            uploadTokenSpec: undefined,
            // Take the new status in case of parse failure was reported.
            status: uploadable.status,
          });
  });
  return resolvedFiles;
}

export function resolveFileNames(
  previousFile: UnBoundFile,
  getFormatted: (
    rawName: number | string | null | undefined
  ) => string | undefined,
  formatter?: UiFormatter
): PartialUploadableFileSpec {
  let nameToParse: string | undefined;
  if (
    formatter === undefined ||
    formatter.fields.some((field) => field instanceof formatterTypeMapper.regex)
  )
    nameToParse = stripLastOccurrence(previousFile.name, '.');
  else {
    const formattedLength = formatter.fields.reduce(
      (length, field) => length + field.size,
      0
    );
    nameToParse = previousFile.name.slice(0, formattedLength);
  }
  previousFile.parsedName = f.maybe(nameToParse, getFormatted);

  return {
    file: previousFile,
  };
}

export function stripLastOccurrence(target: string, delimiter: string) {
  const splittedString = target.split(delimiter);
  return splittedString
    .slice(0, splittedString.length === 1 ? 1 : -1)
    .join(delimiter);
}

const validationPromiseGenerator = async (
  queryResource: SpecifyResource<SpQuery>
): Promise<
  RA<{
    readonly targetId: number;
    readonly restResult: RA<number | string>;
  }>
> =>
  ajax<{
    // First value is the primary key
    readonly results: RA<readonly [number, ...RA<number | string>]>;
  }>('/stored_query/ephemeral/', {
    method: 'POST',
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: 'application/json',
    },
    body: keysToLowerCase({
      ...serializeResource(queryResource),
      countOnly: false,
      limit: 0,
    }),
  }).then(({ data }) =>
    data.results.map(([target, ...restResult]) => ({
      targetId: target,
      restResult,
    }))
  );

const matchFileSpec = (
  uploadFileSpec: RA<PartialUploadableFileSpec>,
  queryResults: RA<{
    readonly targetId: number;
    readonly rawResult: string;
  }>,
  keepDisambiguation: boolean = false
): RA<PartialUploadableFileSpec> =>
  uploadFileSpec.map((spec) => {
    const specParsedName = spec.file?.parsedName;
    // Don't match files already uploaded.
    if (specParsedName === undefined || typeof spec.attachmentId === 'number')
      return spec;
    const matchingResults = queryResults.filter(
      (result) => result.rawResult === specParsedName
    );
    const newSpec: PartialUploadableFileSpec = {
      ...spec,
      matchedId: matchingResults.map((result) => result.targetId),
    };

    if (
      keepDisambiguation &&
      spec.disambiguated !== undefined &&
      // If disambiguation was chosen, but it became invalid, reset disambiguation
      newSpec.matchedId?.includes(spec.disambiguated)
    ) {
      return newSpec;
    }
    return { ...newSpec, disambiguated: undefined };
  });

export async function reconstructDeletingAttachment(
  staticKey: keyof typeof staticAttachmentImportPaths,
  deletableFiles: RA<PartialUploadableFileSpec>
): Promise<RA<PartialUploadableFileSpec>> {
  const baseTable = staticAttachmentImportPaths[staticKey].baseTable;
  const path = `${AttachmentMapping[baseTable].relationship}.${staticAttachmentImportPaths[staticKey].restPath}`;
  const relatedAttachments = filterArray(
    deletableFiles.map((deletable) =>
      deletable.status?.type === 'matched' ? deletable.attachmentId : undefined
    )
  );
  const reconstructingQueryResource = generateInQueryResource(
    baseTable,
    path,
    relatedAttachments,
    'Batch Attachment Upload'
  );
  const queryResults = await validationPromiseGenerator(
    reconstructingQueryResource
  );
  return deletableFiles.map((deletable) => {
    if (deletable.status?.type !== 'matched') return deletable;
    const matchedId = deletable.status.id;
    const foundInQueryResult = queryResults.find(
      ({ targetId, restResult: [attachmentId] }) =>
        targetId === matchedId && attachmentId === deletable.attachmentId
    );
    return {
      ...deletable,
      attachmentId: foundInQueryResult?.restResult[0] as number,
      status:
        foundInQueryResult === undefined
          ? ({ type: 'success', successType: 'uploaded' } as const)
          : deletable.status.type === 'matched'
          ? ({
              type: 'cancelled',
              reason: 'rollbackInterruption',
            } as const)
          : deletable.status,
    };
  });
}
export async function reconstructUploadingAttachmentSpec(
  staticKey: keyof typeof staticAttachmentImportPaths,
  uploadableFiles: RA<PartialUploadableFileSpec>
): Promise<RA<PartialUploadableFileSpec>> {
  const baseTable = staticAttachmentImportPaths[staticKey].baseTable;
  const pathToAttachmentLocation = `${AttachmentMapping[baseTable].relationship}.attachment.attachmentLocation`;
  const filteredAttachmentLocations = filterArray(
    uploadableFiles.map((uploadable) =>
      uploadable.status?.type === 'matched'
        ? uploadable.uploadTokenSpec?.attachmentlocation
        : undefined
    )
  );
  const reconstructingQueryResource = generateInQueryResource(
    baseTable,
    pathToAttachmentLocation,
    filteredAttachmentLocations,
    'Batch Attachment Upload',
    [
      {
        path: `${AttachmentMapping[baseTable].relationship}.${staticAttachmentImportPaths[staticKey].restPath}`,
        isDisplay: true,
        id: queryFieldFilters.any.id,
      },
    ]
  );
  const queryResults = await validationPromiseGenerator(
    reconstructingQueryResource
  );
  return uploadableFiles.map((uploadable) => {
    if (uploadable.status?.type !== 'matched') return uploadable;
    const matchedId = uploadable.status.id;
    const foundInQueryResult = queryResults.find(
      ({ targetId, restResult: [_, attachmentLocation] }) =>
        typeof attachmentLocation === 'string' &&
        targetId === matchedId &&
        attachmentLocation.toString() ===
          uploadable.uploadTokenSpec!.attachmentlocation
    );

    return {
      ...uploadable,
      attachmentId: foundInQueryResult?.restResult[0] as number,
      status:
        typeof foundInQueryResult === 'object'
          ? ({ type: 'success', successType: 'uploaded' } as const)
          : uploadable.status.type === 'matched'
          ? ({
              type: 'cancelled',
              reason: 'uploadInterruption',
            } as const)
          : uploadable.status,
    };
  });
}

export const keyLocalizationMapAttachment = {
  incorrectFormatter: attachmentsText.incorrectFormatter(),
  noFile: attachmentsText.noFile(),
  uploaded: commonText.uploaded(),
  deleted: attachmentsText.deleted(),
  alreadyUploaded: attachmentsText.alreadyUploaded(),
  alreadyDeleted: attachmentsText.alreadyDeleted(),
  skipped: attachmentsText.skipped(),
  cancelled: attachmentsText.cancelled(),
  matchError: attachmentsText.matchError(),
  noAttachments: attachmentsText.noAttachments(),
  uploadInterruption: attachmentsText.frontEndInterruption({
    action: wbText.upload(),
  }),
  rollbackInterruption: attachmentsText.frontEndInterruption({
    action: wbText.rollback(),
  }),
  errorReadingFile: attachmentsText.errorReadingFile(),
  attachmentServerUnavailable: attachmentsText.attachmentServerUnavailable(),
  saveConflict: formsText.saveConflict(),
  unhandledFatalResourceError: attachmentsText.unhandledFatalResourceError(),
  nothingFound: formsText.nothingFound(),
  noMatch: attachmentsText.noMatch(),
  multipleMatches: attachmentsText.multipleMatches(),
  correctlyFormatted: attachmentsText.correctlyFormatted(),
  userStopped: attachmentsText.stoppedByUser(),
} as const;

export function resolveAttachmentStatus(
  attachmentStatus: AttachmentStatus
): string {
  if ('reason' in attachmentStatus) {
    const reason = keyLocalizationMapAttachment[attachmentStatus.reason];
    return commonText.colonLine({
      label: keyLocalizationMapAttachment[attachmentStatus.type],
      value: reason,
    });
  }
  return attachmentStatus.type === 'success'
    ? keyLocalizationMapAttachment[attachmentStatus.successType]
    : '';
}
