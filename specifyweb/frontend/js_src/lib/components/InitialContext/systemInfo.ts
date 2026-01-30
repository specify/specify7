/**
 * Fetch basic server information
 */

import type { LocalizedString } from 'typesafe-i18n';

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
  readonly stats_2_url: string | null;
  readonly discipline_type: string;
  readonly geography_is_global: string;
};

let systemInfo: SystemInfo;

export const fetchContext = load<SystemInfo>(
  '/context/system_info.json',
  'application/json'
).then((data) => {
  systemInfo = data;

  return systemInfo;
});

export const getSystemInfo = (): SystemInfo => systemInfo;
