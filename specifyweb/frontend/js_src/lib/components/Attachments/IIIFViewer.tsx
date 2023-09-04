import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { IR, RA } from '../../utils/types';

// Allow to change this
const BASE_IIIF_URL = 'https://test.specifysystems.org:8090/';

// eslint-disable-next-line @typescript-eslint/naming-convention
async function validateIIIF(
  attachmentLocation: string,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers,@typescript-eslint/naming-convention
  IIIF_supported = [1, 2, 3]
): Promise<IR<string>> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  let validIIIF: IR<string> = {};
  const validationPromises: RA<Promise<void>> = IIIF_supported.map(
    async (version) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const baseURL = `${BASE_IIIF_URL}iiif/${version}/${attachmentLocation}/info.json`;
      await ajax<IR<never>>(
        baseURL,
        { method: 'GET', headers: { Accept: 'application/json' } },
        {
          expectedResponseCodes: Object.values(Http),
        }
      ).then(({ status }) => {
        if (status === Http.OK)
          validIIIF = { ...validIIIF, [version]: baseURL };
        return undefined;
      });
    }
  );
  await Promise.all(validationPromises);
  return validIIIF;
}

export function useIIIFSpec(
  attachmentLocation: string
): IR<string> | undefined {
  const [validIIIF] = useAsyncState<IR<string>>(
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
