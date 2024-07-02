import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { resolveBackendParsingMessage } from '../WorkBench/resultsParser';
import type { LocalityUpdateHeader, LocalityUpdateTaskStatus } from './types';

const localityUpdateAcceptedLocalityFields: RA<
  Lowercase<keyof Tables['Locality']['fields']>
> = ['guid', 'datum', 'latitude1', 'longitude1'];

export const localityUpdateAcceptedHeaders = f.store(
  () =>
    new Set([
      ...localityUpdateAcceptedLocalityFields,
      ...tables.GeoCoordDetail.literalFields
        .map(({ name }) => name.toLowerCase())
        .filter((header) => header !== 'locality'),
    ])
);

export const localityUpdateRequiredHeaders = new Set<LocalityUpdateHeader>([
  'guid',
]);

export const localityUpdateStatusLocalization: RR<
  LocalityUpdateTaskStatus,
  LocalizedString
> = {
  PARSED: localityText.localityUpdateParsed(),
  PARSING: localityText.localityUpdateParsing(),
  PENDING: localityText.localityUpdateStarting(),
  PROGRESS: localityText.localityUpdateProgressing(),
  FAILED: localityText.localityUpdateFailed(),
  PARSE_FAILED: localityText.localityUpdateParseFailure(),
  ABORTED: localityText.localityUpdateCancelled(),
  SUCCEEDED: localityText.localityUpdateSucceeded(),
};

export function resolveLocalityUpdateErrorMessage(
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
      value: Object.keys(payload).length === 0 ? '' : JSON.stringify(payload),
    });
  }
}
