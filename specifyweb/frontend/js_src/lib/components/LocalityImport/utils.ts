import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { resolveBackendParsingMessage } from '../WorkBench/resultsParser';
import type { LocalityImportHeader, LocalityImportTaskStatus } from './types';

export const localityImportAcceptedLocalityFields: RA<
  Lowercase<keyof Tables['Locality']['fields']>
> = ['guid', 'datum', 'latitude1', 'longitude1'];

export const localityImportAcceptedHeaders = f.store(
  () =>
    new Set([
      ...localityImportAcceptedLocalityFields,
      ...tables.GeoCoordDetail.literalFields
        .map(({ name }) => name.toLowerCase())
        .filter((header) => header !== 'locality'),
    ])
);

export const localityImportRequiredHeaders = new Set<LocalityImportHeader>([
  'guid',
]);

export const localityImportStatusLocalization: RR<
  LocalityImportTaskStatus,
  LocalizedString
> = {
  PARSING: localityText.localityImportParsing(),
  PENDING: localityText.localityImportStarting(),
  PROGRESS: localityText.localityImportProgressing(),
  FAILED: localityText.localityImportFailed(),
  ABORTED: localityText.localityImportCancelled(),
  SUCCEEDED: localityText.localityImportSucceeded(),
};

export function resolveImportLocalityErrorMessage(
  key: string,
  payload: IR<unknown>
): LocalizedString {
  const baseParseResults = resolveBackendParsingMessage(key, payload);

  if (baseParseResults !== undefined) {
    return baseParseResults;
  } else if (key === 'guidHeaderNotProvided') {
    return localityText.guidHeaderNotProvided();
  } else if (key === 'noLocalityMatchingGuid') {
    return localityText.noLocalityMatchingGuid({
      guid: payload.guid as string,
    });
  } else if (key === 'multipleLocalitiesWithGuid') {
    return localityText.multipleLocalitiesWithGuid({
      guid: payload.guid as string,
      localityIds: (payload.localityIds as RA<number>).join(', '),
    });
  } else {
    return commonText.colonLine({
      label: key,
      value:
        Object.keys(payload).length === 0 ? '' : `${JSON.stringify(payload)}`,
    });
  }
}
