import { load } from './initialcontext';

const systemInfo = {
  user_agent: window.navigator.userAgent,
} as unknown as SystemInfo;

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
    const queryString = Object.entries(payload)
      .map(([key, value]) => `${key}=${value}`)
      .join('?');
    fetch(`${systemInfo.stats_url}${queryString}`).catch(console.error);
  }
});

export default systemInfo as Readonly<SystemInfo>;
