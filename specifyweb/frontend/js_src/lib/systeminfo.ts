/**
 * Fetch basic server information
 */

import { Http, ping } from './ajax';
import { softFail } from './components/errorboundary';
import { load } from './initialcontext';
import { formatUrl } from './querystring';

type SystemInfo = {
  readonly version: string;
  readonly specify6_version: string;
  readonly database_version: string;
  readonly schema_version: string;
  readonly collection: string;
  readonly collection_guid: string;
  readonly database: string;
  readonly discipline: string;
  readonly institution: string;
  readonly institution_guid: string;
  readonly isa_number: string;
  readonly stats_url: string | null;
}

let systemInfo: SystemInfo;

export const fetchContext = load<SystemInfo>(
  '/context/system_info.json',
  'application/json'
).then((data) => {
  systemInfo = data;
  if (systemInfo.stats_url !== null)
    ping(
      formatUrl(
        systemInfo.stats_url,
        {
          version: systemInfo.version,
          dbVersion: systemInfo.database_version,
          institution: systemInfo.institution,
          institutionGUID: systemInfo.institution_guid,
          discipline: systemInfo.discipline,
          collection: systemInfo.collection,
          collectionGUID: systemInfo.collection_guid,
          isaNumber: systemInfo.isa_number,
        },
        /*
         * I don't know if the receiving server handles GET parameters in a
         * case-sensitive way. Thus, don't convert keys to lower case, but leave
         * them as they were sent in previous versions of Specify 7
         */
        false
      ),
      {},
      { strict: false, expectedResponseCodes: [Http.NO_CONTENT] }
    ).catch(softFail);
});

export const getSystemInfo = (): SystemInfo => systemInfo;
