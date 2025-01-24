/**
 * Fetch basic server information
 */

import type { LocalizedString } from 'typesafe-i18n';

import { ping } from '../../utils/ajax/ping';
import { softFail } from '../Errors/Crash';
import { formatUrl } from '../Router/queryString';
import { load } from './index';

type SystemInfo = {
  readonly version: LocalizedString;
  readonly specify6_version: LocalizedString;
  readonly database_version: LocalizedString;
  readonly schema_version: LocalizedString;
  readonly collection: string;
  readonly collection_guid: LocalizedString;
  readonly database: string;
  readonly discipline: string;
  readonly institution: string;
  readonly institution_guid: LocalizedString;
  readonly isa_number: LocalizedString;
  readonly stats_url: string | null;
  readonly discipline_type: string;
};

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
          disciplineType: systemInfo.discipline_type,
        },
        /*
         * I don't know if the receiving server handles GET parameters in a
         * case-sensitive way. Thus, don't convert keys to lower case, but leave
         * them as they were sent in previous versions of Specify 7
         */
        false
      ),
      { errorMode: 'silent' }
    ).catch(softFail);
  return systemInfo;
});

export const getSystemInfo = (): SystemInfo => systemInfo;
