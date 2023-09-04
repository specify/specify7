import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';

// Allow to change this
const BASE_IIIF_URL = 'https://test.specifysystems.org:8090/';

export const getIIIFUrlFromVersion = (
  version: number,
  location: string
): string => `${BASE_IIIF_URL}iiif/${version}/${location}/info.json`;

// eslint-disable-next-line @typescript-eslint/naming-convention
async function validateIIIF(
  attachmentLocation: string,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers,@typescript-eslint/naming-convention
  IIIF_supported = [1, 2, 3]
): Promise<RA<number>> {
  const validationPromises: RA<Promise<number | undefined>> =
    IIIF_supported.map(async (version) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const baseURL = getIIIFUrlFromVersion(version, attachmentLocation);
      return ajax<IR<never>>(
        baseURL,
        { method: 'GET', headers: { Accept: 'application/json' } },
        {
          expectedResponseCodes: Object.values(Http),
        }
      ).then(({ status }) => {
        if (status === Http.OK) return version;
        return undefined;
      });
    });
  return filterArray(await Promise.all(validationPromises));
}

export function useIIIFSpec(
  attachmentLocation: string
): RA<number> | undefined {
  const [validIIIF] = useAsyncState<RA<number>>(
    React.useCallback(
      async () => validateIIIF(attachmentLocation),
      [attachmentLocation]
    ),
    true
  );
  return validIIIF;
}

export function IIIFViewer({
  baseUrl,
  title,
}: {
  readonly baseUrl: string;
  readonly title: string;
}): JSX.Element {
  return (
    <iframe
      src={`https://mejackreed.github.io/Leaflet-IIIF/examples/?url=${baseUrl}`}
      style={{
        width: '800px',
        height: '600px',
      }}
      title={title}
    />
  );
}
