import React from 'react';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { genericTables } from '../DataModel/tables';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { downloadDataSet } from '../WorkBench/helpers';
import { QueryButton } from './Components';
import type { QueryField } from './helpers';
import { hasLocalityColumns } from './helpers';
import type { QueryResultRow } from './Results';

export function QueryExportButtons({
  baseTableName,
  fields,
  queryResource,
  getQueryFieldRecords,
  recordSetId,
  results,
  selectedRows,
}: {
  readonly baseTableName: keyof Tables;
  readonly fields: RA<QueryField>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
  readonly recordSetId: number | undefined;
  readonly results: React.MutableRefObject<
    RA<QueryResultRow | undefined> | undefined
  >;
  readonly selectedRows: ReadonlySet<number>;
}): JSX.Element {
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));

  const [state, setState] = React.useState<'creating' | 'warning' | undefined>(
    undefined
  );

  function doQueryExport(
    url: string,
    delimiter: string | undefined,
    encoding: string | undefined
  ): void {
    if (typeof getQueryFieldRecords === 'function')
      queryResource.set('fields', getQueryFieldRecords());
    const serialized = queryResource.toJSON();
    setState('creating');
    void ping(url, {
      method: 'POST',
      body: keysToLowerCase({
        ...serialized,
        captions: fields
          .filter(({ isDisplay }) => isDisplay)
          .map(({ mappingPath }) =>
            generateMappingPathPreview(baseTableName, mappingPath)
          ),
        recordSetId,
        delimiter,
        encoding,
      }),
      errorMode: 'dismissible',
    });
  }

  const [separator] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'exportFileDelimiter'
  );

  const [utf8BOM] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'exportCSVutf8BOM'
  );
  const csvEncoding = utf8BOM ? 'utf-8-sig' : 'utf-8';

  /*
   *Will be only called if query is not distinct,
   *selection not enabled when distinct selected
   */
  async function exportSelected(): Promise<void> {
    const name = `${
      queryResource.isNew()
        ? `${queryText.newQueryName()} ${genericTables[baseTableName].label}`
        : queryResource.get('name')
    } - ${new Date().toDateString()}.csv`;

    const selectedResults = results?.current?.map((row) =>
      row !== undefined && f.has(selectedRows, row[0])
        ? row?.slice(1).map((cell) => cell?.toString() ?? '')
        : undefined
    );

    if (selectedResults === undefined) return undefined;

    const filteredResults = filterArray(selectedResults);

    const columnsName = fields
      .filter((field) => field.isDisplay)
      .map((field) =>
        generateMappingPathPreview(baseTableName, field.mappingPath)
      );

    return downloadDataSet(name, filteredResults, columnsName, separator);
  }

  const containsResults = results.current?.some((row) => row !== undefined);

  const canUseKml =
    (baseTableName === 'Locality' ||
      fields.some(({ mappingPath }) => mappingPath.includes('locality'))) &&
    containsResults &&
    hasPermission('/querybuilder/query', 'export_kml');

  return (
    <>
      {state === 'creating' ? (
        <Dialog
          buttons={commonText.close()}
          header={queryText.queryExportStarted()}
          onClose={(): void => setState(undefined)}
        >
          {queryText.queryExportStartedDescription()}
        </Dialog>
      ) : state === 'warning' ? (
        <Dialog
          buttons={commonText.close()}
          header={queryText.missingCoordinatesForKml()}
          onClose={(): void => setState(undefined)}
        >
          {queryText.missingCoordinatesForKmlDescription()}
        </Dialog>
      ) : undefined}
      {containsResults && hasPermission('/querybuilder/query', 'export_csv') && (
        <QueryButton
          disabled={fields.length === 0}
          showConfirmation={showConfirmation}
          onClick={(): void => {
            selectedRows.size === 0
              ? doQueryExport('/stored_query/exportcsv/', separator, csvEncoding)
              : exportSelected().catch(softFail);
          }}
        >
          {queryText.createCsv()}
        </QueryButton>
      )}
      {canUseKml && (
        <QueryButton
          disabled={fields.length === 0}
          showConfirmation={showConfirmation}
          onClick={(): void =>
            hasLocalityColumns(fields)
              ? doQueryExport('/stored_query/exportkml/', undefined, undefined)
              : setState('warning')
          }
        >
          {queryText.createKml()}
        </QueryButton>
      )}
    </>
  );
}
