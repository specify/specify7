/**
 * Fetch basic server information
 */

import type { LocalizedString } from 'typesafe-i18n';

import { load } from './index';

type SystemInfo = {
  readonly version: LocalizedString;
  readonly specify6_version: LocalizedString;
  readonly setup_complete: boolean;
  readonly database_version: LocalizedString | null;
  readonly schema_version: LocalizedString | null;
  readonly collection: string | null;
  readonly collection_guid: LocalizedString | null;
  readonly database: string;
  readonly discipline: string | null;
  readonly institution: string | null;
  readonly institution_guid: LocalizedString | null;
  readonly isa_number: LocalizedString | null;
  readonly stats_url: string | null;
  readonly stats_2_url: string | null;
  readonly discipline_type: string | null;
  readonly geography_is_global: boolean | null;
};

let systemInfo: SystemInfo;

export const fetchContext = load<SystemInfo>(
  '/context/system_info.json',
  'application/json'
).then(async (data) => {
  systemInfo = data;

  return systemInfo;
});

export const getSystemInfo = (): SystemInfo => systemInfo;
