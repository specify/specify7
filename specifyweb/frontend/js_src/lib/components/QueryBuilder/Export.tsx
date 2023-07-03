import React from 'react';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { downloadFile } from '../Molecules/FilePicker';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { QueryButton } from './Components';
import { hasLocalityColumns, QueryField } from './helpers';
import type { QueryResultRow } from './Results';
import { create as createXMLBuilder } from 'xmlbuilder2';

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

  /*
   *Will be only called if query is not distinct,
   *selection not enabled when distinct selected
   */
  const selectedResults = results?.current?.filter((item) =>
    f.has(selectedRows, item?.[0])
  );
  function handleSelectedResults(): string {
    const joinedSelected = selectedResults?.map((subArray) =>
      subArray?.slice(1).join(separator)
    );

    const resultToExport = [
      fields
        .map((field) =>
          generateMappingPathPreview(baseTableName, field.mappingPath)
        )
        .join(separator),
      ...(joinedSelected ?? []),
    ];

    return resultToExport.join('\n');
  }

  function handleSelectedResultsKml(): string {
    const xmlBuilder = createXMLBuilder({ version: '1.0', encoding: 'utf-8' });
    const kml = xmlBuilder.ele('kml', {
      xmlns: 'http://earth.google.com/kml/2.2',
    });
    const document = kml.ele('Document');

    selectedResults?.forEach((result) => {
      const placemark = document.ele('Placemark');
      const extendedData = placemark.ele('ExtendedData');

      fields.forEach((field, index) => {
        const fieldValue = result?.[index + 1];
        const data = extendedData.ele('Data', { name: field.mappingPath });
        data.ele('value').txt(String(fieldValue));
      });

      const nameValue = fields.map((field) => result?.[field.id]).join(' - ');
      placemark.ele('name').txt(String(nameValue));

      const coordinatesValue = fields
        .filter(
          (field) =>
            field.mappingPath.toString().includes('latitude') ||
            field.mappingPath.toString().includes('longitude')
        )
        .map((field) => result?.[field.id])
        .join(', ');

      placemark.ele('Point').ele('coordinates').txt(coordinatesValue);
    });

    return kml.end({ prettyPrint: true });
  }

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
              ? doQueryExport('/stored_query/exportcsv/', separator)
              : downloadFile(
                  `${
                    queryResource.isNew()
                      ? `${queryText.newQueryName()} -
                        ${schema.models[baseTableName].label}`
                      : queryResource.get('name')
                  } - ${new Date().toDateString()}.csv`,
                  handleSelectedResults()
                );
          }}
        >
          {queryText.createCsv()}
        </QueryButton>
      )}
      {canUseKml && (
        <QueryButton
          disabled={fields.length === 0}
          showConfirmation={showConfirmation}
          onClick={(): void => {
            hasLocalityColumns(fields)
              ? selectedRows.size === 0
                ? doQueryExport('/stored_query/exportkml/', undefined)
                : (() => {
                    const fileName = `${
                      queryResource.isNew()
                        ? `${queryText.newQueryName()} - ${
                            schema.models[baseTableName].label
                          }`
                        : queryResource.get('name')
                    } - ${new Date().toDateString()}`;
                    const fileData = handleSelectedResultsKml();

                    downloadFile(`${fileName}.kml`, fileData);
                  })()
              : setState('warning');
          }}
        >
          {queryText.createKml()}
        </QueryButton>
      )}
    </>
  );
}
