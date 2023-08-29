import type { LocalizedString } from 'typesafe-i18n';

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
  removeKey,
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
  PostWorkUploadSpec,
  UnBoundFile,
} from './types';

const isAttachmentMatchValid = (uploadSpec: PartialUploadableFileSpec) =>
  uploadSpec.matchedId !== undefined &&
  (uploadSpec.matchedId.length === 1 || uploadSpec.disambiguated !== undefined);

const findFirstReason =
  (
    conditions: (uploadSpec: PartialUploadableFileSpec) => RA<boolean>,
    humanReasons: RA<LocalizedString>
  ) =>
  (uploadSpec: PartialUploadableFileSpec) => {
    const resolvedConditions = conditions(uploadSpec);
    return mappedFind(resolvedConditions, (condition, index) =>
      condition ? undefined : humanReasons[index]
    );
  };

const uploadHumanReasons = [
  attachmentsText.alreadyUploaded(),
  attachmentsText.noFile(),
  attachmentsText.incorrectFormatter(),
  attachmentsText.matchError(),
];

const deleteHumanReasons = [
  attachmentsText.noAttachments(),
  attachmentsText.matchError(),
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

    if (matchedIndex === -1) {
      resolvedFiles = insertItem(
        resolvedFiles,
        resolvedFiles.length,
        uploadable
      );
    } else {
      resolvedFiles = replaceItem(resolvedFiles, matchedIndex, {
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
    }
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
  if (formatter === undefined) {
    nameToParse = stripLastOccurrence(previousFile.name, '.');
  } else {
    const formattedLength = formatter.fields.reduce(
      (length, field) => length + field.getSize(),
      0
    );
    nameToParse = previousFile.name.slice(0, formattedLength);
  }
  previousFile.parsedName = f.maybe(nameToParse, getFormatted);

  return {
    file: previousFile,
    status:
      previousFile.parsedName === undefined ? 'incorrectFormatter' : undefined,
  };
}

export function stripLastOccurrence(target: string, delimiter: string) {
  const splittedString = target.split(delimiter);
  return splittedString
    .slice(0, splittedString.length === 1 ? 1 : -1)
    .join(delimiter);
}

async function validationPromiseGenerator(
  queryResource: SpecifyResource<SpQuery>
): Promise<
  RA<{
    readonly targetId: number;
    readonly restResult: RA<number | string>;
  }>
> {
  return ajax<{
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
}

function matchFileSpec(
  uploadFileSpec: RA<PartialUploadableFileSpec>,
  queryResults: RA<{
    readonly targetId: number;
    readonly rawResult: string;
  }>,
  keepDisambiguation: boolean = false
): RA<PartialUploadableFileSpec> {
  return uploadFileSpec.map((spec) => {
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
}
export async function reconstructDeletingAttachment(
  staticKey: keyof typeof staticAttachmentImportPaths,
  deletableFiles: RA<PostWorkUploadSpec<'deleting'>>
): Promise<RA<PartialUploadableFileSpec>> {
  const baseTable = staticAttachmentImportPaths[staticKey].baseTable;
  const path = `${AttachmentMapping[baseTable].relationship}.${staticAttachmentImportPaths[staticKey].restPath}`;
  const relatedAttachments = filterArray(
    deletableFiles.map((deletable) =>
      deletable.canDelete ? deletable.attachmentId : undefined
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
    if (!deletable.canDelete) return deletable;
    const matchedId =
      deletable.matchedId?.length === 1
        ? deletable.matchedId[0]
        : deletable.disambiguated;
    const foundInQueryResult = queryResults.find(
      ({ targetId, restResult: [attachmentId] }) =>
        targetId === matchedId && attachmentId === deletable.attachmentId
    );
    return removeKey(
      {
        ...deletable,
        attachmentId: foundInQueryResult?.restResult[0] as number,
        status:
          foundInQueryResult === undefined
            ? ('deleted' as AttachmentStatus)
            : deletable.status ??
              ({
                type: 'cancelled',
                reason: keyLocalizationMapAttachment.frontendInterruption(
                  wbText.rollback()
                ),
              } as const),
      },
      'canDelete'
    );
  });
}
export async function reconstructUploadingAttachmentSpec(
  staticKey: keyof typeof staticAttachmentImportPaths,
  uploadableFiles: RA<PostWorkUploadSpec<'uploading'>>
): Promise<RA<PartialUploadableFileSpec>> {
  const baseTable = staticAttachmentImportPaths[staticKey].baseTable;
  const pathToAttachmentLocation = `${AttachmentMapping[baseTable].relationship}.attachment.attachmentLocation`;
  const filteredAttachmentLocations = filterArray(
    uploadableFiles.map((uploadable) =>
      uploadable.canUpload
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
    if (!uploadable.canUpload) return uploadable;

    const matchedId =
      uploadable.matchedId?.length === 1
        ? uploadable.matchedId[0]
        : uploadable.disambiguated;
    const foundInQueryResult = queryResults.find(
      ({ targetId, restResult: [_, attachmentLocation] }) =>
        typeof attachmentLocation === 'string' &&
        targetId === matchedId &&
        attachmentLocation.toString() ===
          uploadable.uploadTokenSpec!.attachmentlocation
    );

    return removeKey(
      {
        ...uploadable,
        attachmentId: foundInQueryResult?.restResult[0] as number,
        status:
          typeof foundInQueryResult === 'object'
            ? ('uploaded' as AttachmentStatus)
            : uploadable.status ??
              ({
                type: 'cancelled',
                reason: keyLocalizationMapAttachment.frontendInterruption(
                  wbText.upload()
                ),
              } as const),
      },
      'canUpload'
    );
  });
}

const keyLocalizationMapAttachment = {
  incorrectFormatter: attachmentsText.incorrectFormatter(),
  noFile: attachmentsText.noFile(),
  uploaded: commonText.uploaded(),
  deleted: attachmentsText.deleted(),
  alreadyUploaded: attachmentsText.alreadyUploaded(),
  alreadyDeleted: attachmentsText.alreadyDeleted(),
  skipped: attachmentsText.skipped(),
  cancelled: attachmentsText.cancelled(),
  frontendInterruption: (action: LocalizedString) =>
    attachmentsText.frontEndInterruption({ action }),
} as const;

export const resolveAttachmentStatus = (
  attachmentStatus: AttachmentStatus
): string => {
  if (typeof attachmentStatus === 'object') {
    return `${keyLocalizationMapAttachment[attachmentStatus.type]}: ${
      attachmentStatus.reason
    }`;
  }
  return `${keyLocalizationMapAttachment[attachmentStatus]}`;
};
