import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { getIiifServerUrl } from './attachments';

const getIiifInfoFromLocation = (
  location: string,
  version: number,
  iiifServer: string
) => `${iiifServer}/${version}/${location}/info.json`;

type IiifSpec = { readonly version: number; readonly url: string };

async function validateIiif(
  attachmentLocation: string,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  iiifSupported = [1, 2, 3]
): Promise<RA<IiifSpec> | undefined> {
  const iiifServer = getIiifServerUrl();
  if (iiifServer === undefined) return undefined;
  const validationPromises = iiifSupported.map(async (version) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const baseURL = getIiifInfoFromLocation(
      attachmentLocation,
      version,
      iiifServer
    );
    return ajax<IR<never>>(
      baseURL,
      { method: 'GET', headers: { Accept: 'application/json' } },
      {
        expectedResponseCodes: Object.values(Http),
      }
    ).then(({ status }) => {
      if (status === Http.OK) return { version, url: baseURL };
      return undefined;
    });
  });
  return filterArray(await Promise.all(validationPromises));
}

export function useIiifSpec(
  attachmentLocation: string
): RA<IiifSpec> | undefined {
  const [validIiif] = useAsyncState(
    React.useCallback(
      async () => validateIiif(attachmentLocation),
      [attachmentLocation]
    ),
    true
  );
  return validIiif;
}

export function IiifViewer({
  baseUrl,
  title,
}: {
  readonly baseUrl: string;
  readonly title: string;
}): JSX.Element {
  return (
    <iframe
      className="flex flex-1"
      src={`https://mejackreed.github.io/Leaflet-IIIF/examples/?url=${baseUrl}`}
      title={title}
    />
  );
}
