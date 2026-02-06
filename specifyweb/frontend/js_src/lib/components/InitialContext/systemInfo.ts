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
};

type StatsCounts = {
  readonly Collectionobject: number;
  readonly Collection: number;
  readonly Specifyuser: number;
};

let systemInfo: SystemInfo;

function buildStatsLambdaUrl(base: string | null | undefined): string | null {
  if (!base) return null;
  let u = base.trim();

  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;

  const hasRoute = /\/(prod|default)\/[^\s/]+/.test(u);
  if (!hasRoute) {
    const stage = 'prod';
    const route = 'AggrgatedSp7Stats';
    u = `${u.replace(/\/$/, '')  }/${stage}/${route}`;
  }
  return u;
}

export const fetchContext = load<SystemInfo>(
  '/context/system_info.json',
  'application/json'
).then(async (data) => {
  systemInfo = data;

  return systemInfo;
});

export const getSystemInfo = (): SystemInfo => systemInfo;