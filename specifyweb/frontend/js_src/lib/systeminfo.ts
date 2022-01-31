import { load } from './initialcontext';
import * as querystring from './querystring';

const systemInfo = {} as SystemInfo;

type SystemInfo = {
  version: string;
  specify6_version: string;
  database_version: string;
  schema_version: string;
  collection: string;
  collection_guid: string;
  database: string;
  discipline: string;
  institution: string;
  institution_guid: string;
  isa_number: string;
  stats_url: string | null;
};

export const fetchContext = load<SystemInfo>(
  '/context/system_info.json',
  'application/json'
).then((data) => {
  Object.entries(data).forEach(([key, value]) => {
    // @ts-expect-error
    systemInfo[key as keyof SystemInfo] = value;
  });
  if (systemInfo.stats_url != null) {
    const payload = {
      version: systemInfo.version,
      dbVersion: systemInfo.database_version,
      institution: systemInfo.institution,
      institutionGUID: systemInfo.institution_guid,
      discipline: systemInfo.discipline,
      collection: systemInfo.collection,
      collectionGUID: systemInfo.collection_guid,
      isaNumber: systemInfo.isa_number,
    };
    fetch(querystring.format(systemInfo.stats_url, payload)).catch(
      console.error
    );
  }
});

export const systemInformation: Readonly<SystemInfo> = systemInfo;
