import React from 'react';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { ping } from '../../utils/ajax/ping';
import type { RA } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { QueryButton } from './Components';
import { QueryField } from './helpers';
import { hasLocalityColumns } from './helpers';
import { QueryResultRow } from './Results';
import { downloadFile } from '../Molecules/FilePicker';

export function QueryExportButtons({
  baseTableName,
  fields,
  queryResource,
  getQueryFieldRecords,
  recordSetId,
  resultsArray,
  selectedRows,
}: {
  readonly baseTableName: keyof Tables;
  readonly fields: RA<QueryField>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
  readonly recordSetId: number | undefined;
  readonly resultsArray: RA<QueryResultRow | undefined> | undefined;
  readonly selectedRows: ReadonlySet<number>;
}): JSX.Element {
  const showConfirmation = (): boolean =>
    fields.some(({ mappingPath }) => !mappingPathIsComplete(mappingPath));

  const [state, setState] = React.useState<'creating' | 'warning' | undefined>(
    undefined
  );

  function doQueryExport(url: string, delimiter: string | undefined): void {
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
      }),
    });
  }

  const [separator] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'exportFileDelimiter'
  );

  const selectedResults = resultsArray?.filter((item) => {
    if (item && typeof item[0] === 'number') {
      return selectedRows.has(item[0]);
    }
    return false;
  });
  const joinedSelected = selectedResults?.map((subArray) =>
    subArray?.slice(1).join(separator)
  );

  const resultToExport = [
    fields
      .map((field) =>
        generateMappingPathPreview(baseTableName, field.mappingPath)
      )
      .join(separator),
    ...(joinedSelected ? joinedSelected : []),
  ];

  const joinedResults = resultToExport.join('\n');

  const canUseKml =
    (baseTableName === 'Locality' ||
      fields.some(({ mappingPath }) => mappingPath.includes('locality'))) &&
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
      {hasPermission('/querybuilder/query', 'export_csv') && (
        <QueryButton
          disabled={fields.length === 0}
          showConfirmation={showConfirmation}
          onClick={(): void => {
            selectedRows.size === 0
              ? doQueryExport(
                  '/stored_query/exportcsv/',
                  userPreferences.get(
                    'queryBuilder',
                    'behavior',
                    'exportFileDelimiter'
                  )
                )
              : downloadFile('querySelectionExport.tsv', joinedResults);
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
              ? doQueryExport('/stored_query/exportkml/', undefined)
              : setState('warning')
          }
        >
          {queryText.createKml()}
        </QueryButton>
      )}
    </>
  );
}
