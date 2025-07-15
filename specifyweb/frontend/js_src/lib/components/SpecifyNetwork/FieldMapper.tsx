/**
 * Convert field names to field labels
 */

import React from 'react';

import { specifyNetworkText } from '../../localization/specifyNetwork';
import type { IR, RA } from '../../utils/types';
import { camelToHuman, capitalize } from '../../utils/utils';
import { BrokerValue } from './FormatValue';

// Replace a word with a mapped variant
const fieldPartMapper: IR<string> = {
  gbif: 'GBIF',
  idigbio: 'iDigBio',
  itis: 'ITIS',
  id: 'ID',
  uuid: 'UUID',
  url: 'URL',
  tsn: 'TSN',
  lsid: 'LSID',
  worms: 'WoRMS',
};

// Replace field name with a label
const labelMapper: IR<string> = {
  'idigbio:uuid': 'iDigBio Record UUID',
  'mopho:specimen.specimen_id': 'MorphoSource ID',
  'dwc:stateProvince': 'State/Province',
  'gbif:gbifID': 'GBIF Record ID',
  'gbif:publishingOrgKey': 'GBIF Publisher ID',
  's2n:specify_identifier': 'Specify Record ID',
  'dcterms:modified': 'Modified by Host',
  'dwc:decimalLongitude': 'Longitude',
  'dwc:decimalLatitude': 'Latitude',
  's2n:worms_match_type': 'WoRMS Match Type',
  's2n:hierarchy': 'Classification',
};

const extractMorphoSourceId = (link: string): string | undefined =>
  link.startsWith('https://www.morphosource.org/')
    ? /\/[^/]+$/u.exec(link)?.[0].slice(1)
    : undefined;

const extractWormsId = (wormsLsid: string): string | undefined =>
  wormsLsid.startsWith('urn:lsid:marinespecies.org:taxname:')
    ? /\d+$/u.exec(wormsLsid)?.[0]
    : undefined;

const linkify = (link: string) =>
  function (key: string): JSX.Element | '' {
    return key ? (
      <a href={`${link}${key}`} rel="noreferrer" target="_blank">
        {key}
      </a>
    ) : (
      ''
    );
  };

const stringGuard =
  (callback: (value: string) => JSX.Element | string) =>
  (value: unknown): JSX.Element | string =>
    typeof value === 'string' ? callback(value) : '';

// Replace field value with a transformed value
const valueMapper: IR<(value: unknown) => JSX.Element | string> = {
  'gbif:publishingOrgKey': stringGuard(
    linkify('https://www.gbif.org/publisher/')
  ),
  'gbif:gbifID': stringGuard(linkify('https://www.gbif.org/occurrence/')),
  'idigbio:uuid': stringGuard(
    linkify('https://www.idigbio.org/portal/records/')
  ),
  'mopho:specimen.specimen_id': stringGuard((specimenViewUrl) =>
    typeof extractMorphoSourceId(specimenViewUrl) === 'string' ? (
      <a href={specimenViewUrl} rel="noreferrer" target="_blank">
        {extractMorphoSourceId(specimenViewUrl)}
      </a>
    ) : (
      specimenViewUrl
    )
  ),
  's2n:worms_lsid': stringGuard((wormsLsid) =>
    typeof extractWormsId(wormsLsid) === 'string' ? (
      <a
        href={`http://www.marinespecies.org/aphia.php?p=taxdetails&id=${extractWormsId(
          wormsLsid
        )}`}
        rel="noreferrer"
        target="_blank"
      >
        {wormsLsid}
      </a>
    ) : (
      wormsLsid
    )
  ),
};

const mergeFields: RA<{
  readonly fieldNames: RA<string>;
  readonly label: string;
  readonly title: string;
  readonly mergeFunction: (values: RA<unknown>) => JSX.Element | string;
}> = [
  {
    fieldNames: ['dwc:year', 'dwc:month', 'dwc:day'],
    label: specifyNetworkText.collectionDate(),
    title: 'dwc:month / dwc:day / dwc:year',
    // @ts-expect-error
    mergeFunction: ([year, month, day]: Readonly<
      readonly [string, string, string]
    >): JSX.Element | '' =>
      [year, month, day].every(Boolean) ? (
        <input
          aria-label={specifyNetworkText.collectionDate()}
          className="pointer-events-none text-inherit"
          readOnly
          tabIndex={-1}
          type="date"
          value={`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`}
        />
      ) : (
        ''
      ),
  },
];

function labelFromFieldName(fieldName: string): string {
  const strippedFieldName = fieldName.replace(/^\w+:/u, '');
  const formattedFieldName = camelToHuman(strippedFieldName);
  const convertedFieldName = formattedFieldName
    .split('_')
    .map((part) => capitalize(part))
    .join(' ');

  const mappedFieldName = convertedFieldName
    .split(' ')
    .map((part) => fieldPartMapper[part.toLowerCase()] ?? part);

  if (mappedFieldName[0].toLowerCase() in labelMapper)
    mappedFieldName[0] = labelMapper[mappedFieldName[0]];

  return capitalize(mappedFieldName.join(' '));
}

function isLink(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function DefaultValueFormatter(value: unknown): JSX.Element | string {
  if (value === undefined) return '';
  else if (typeof value === 'string' && isLink(value))
    return (
      <a href={value} rel="noreferrer" target="_blank">
        {value}
      </a>
    );
  else if (typeof value === 'string' || typeof value === 'number')
    return `${value}`;
  else return <BrokerValue>{value}</BrokerValue>;
}

const transpose = <T,>(array: RA<RA<T>>): RA<RA<T>> =>
  array[0].map((_, colIndex) => array.map((row) => row[colIndex]));

type TableRow<T> = {
  readonly label: string;
  readonly title: string;
  readonly originalCells: RA<T>;
  readonly cells: RA<JSX.Element | string>;
};

export function mapBrokerFields<T>(dictionary: IR<RA<T>>): RA<TableRow<T>> {
  const mergedFields = new Set();
  return Object.entries(dictionary)
    .map(([fieldName, values]) => {
      if (mergedFields.has(fieldName)) return undefined;

      const resolvedValueMapper =
        valueMapper[fieldName] ?? DefaultValueFormatter;

      const merge =
        resolvedValueMapper === undefined
          ? mergeFields.find(({ fieldNames }) => fieldNames.includes(fieldName))
          : undefined;
      if (merge) {
        merge.fieldNames.forEach((fieldName) => mergedFields.add(fieldName));
        const cells = transpose(
          merge.fieldNames.map((fieldName) => dictionary[fieldName])
        );
        return {
          label: merge.label,
          title: merge.title,
          originalCells: cells.map((cells) => JSON.stringify(cells)),
          cells: cells.map(merge.mergeFunction),
        };
      } else
        return {
          label: labelMapper[fieldName] ?? labelFromFieldName(fieldName),
          title: fieldName,
          originalCells: values,
          cells: values.map(resolvedValueMapper) as RA<JSX.Element | string>,
        };
    })
    .filter((row): row is TableRow<T> => row !== undefined);
}
