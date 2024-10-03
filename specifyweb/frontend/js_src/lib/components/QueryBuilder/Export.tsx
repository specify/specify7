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
import { format } from '../Formatters/formatters';
import { jsonToXml, XmlNode } from '../Syncer/xmlToJson';
import { downloadFile } from '../Molecules/FilePicker';

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
    bom: boolean | undefined
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
        bom,
      }),
      errorMode: 'dismissible',
    });
  }

  const [separator] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'exportFileDelimiter'
  );

  const [utf8Bom] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'exportCsvUtf8Bom'
  );

  function formatExportFileName(
    file_extension: string
  ): string {
    return `${
      queryResource.isNew()
        ? `${queryText.newQueryName()} ${genericTables[baseTableName].label}`
        : queryResource.get('name')
    } - ${new Date().toDateString()}.${file_extension}`;
  }

  /*
   *Will be only called if query is not distinct,
   *selection not enabled when distinct selected
   */
  
  async function exportCsvSelected(): Promise<void> {
    const name = formatExportFileName('csv');

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

    return downloadDataSet(
      name,
      filteredResults,
      columnsName,
      separator,
      utf8Bom
    );
  }

  async function exportKmlSelected(): Promise<void> {
    const name = formatExportFileName('kml');

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

    let jsonData: any = {
      tagName: "kml",
      attributes: {
        xmlns: "http://earth.google.com/kml/2.2"
      },
      children: [
        {
          tagName: "Document",
          attributes: {},
          children: []
        }
      ]
    };

    let placemarkTarget = jsonData.children[0].children;

    filteredResults?.forEach((result: any) => {
      let placemark: any = {
        tagName: "Placemark",
        attributes: {},
        children: []
      };

      // <ExtendedData>
      let extendedData: any = {
        tagName: "ExtendedData",
        attributes: {},
        children: []
      };
      
      fields.forEach((field, index) => {
        const fieldValue = result?.[index + 1];

        extendedData.children.push({
          tagName: "Data",
          attributes: { name: field.mappingPath.toString() },
          children: [
            {
              tagName: "value",
              attributes: {},
              children: [],
              type: "Text",
              string: String(fieldValue)
            }
          ]
        });
      });
      // push
      placemark.children.push(extendedData);

      // <name>
      const nameValue = fields.map((field) => result?.[field.id]).join(' - ');
      let nameData: any = {
        tagName: "name",
        attributes: {},
        children: [
          {
            tagName: "name",
            attributes: {},
            children: [],
            type: "Text",
            string: nameValue
          }
        ],
      };
      // push
      placemark.children.push(nameData);

      // <Point>
      const coordinatesValue = fields
        .filter(
          (field) =>
            field.mappingPath.toString().includes('latitude') ||
            field.mappingPath.toString().includes('longitude')
        )
        .map((field) => result?.[field.id])
        .join(', ');
      
      let pointData: any = {
        tagName: "Point",
        attributes: {},
        children: [
          {
            tagName: "coordinates",
            attributes: {},
            children: [
              {
                tagName: "coordinates",
                attributes: {},
                children: [],
                type: "Text",
                string: coordinatesValue
              }
            ],
          }
        ]
      };
      // push
      placemark.children.push(pointData);

      // Insert placemark into document (target)
      placemarkTarget.push(placemark);
    });

    const xmlElement = jsonToXml(jsonData);
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlElement);

    return downloadFile(name, xmlString);
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
              ? doQueryExport('/stored_query/exportcsv/', separator, utf8Bom)
              : exportCsvSelected().catch(softFail);
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
              ? (
                selectedRows.size === 0
                  ? doQueryExport('/stored_query/exportkml/', undefined, undefined)
                  : exportKmlSelected().catch(softFail)
              )
              : setState('warning')
          }
        >
          {queryText.createKml()}
        </QueryButton>
      )}
    </>
  );
}
