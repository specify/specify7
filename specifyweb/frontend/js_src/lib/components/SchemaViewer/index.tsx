import React from 'react';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { welcomeText } from '../../localization/welcome';
import { Container, H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import type { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { downloadFile } from '../Molecules/FilePicker';
import { useTopChild } from '../Preferences/useTopChild';
import { SchemaViewerAside } from './Aside';
import { schemaToTsv } from './schemaToTsv';
import {
  getSchemaViewerTables,
  SchemaViewerTable,
  schemaViewerTableColumns,
} from './Table';
import { SchemaViewerTableList } from './TableList';

export const schemaViewerTopId = 'tables';

export function SchemaViewer(): JSX.Element {
  const tables = React.useMemo(getSchemaViewerTables, []);
  const { visibleChild, forwardRefs, scrollContainerRef } = useTopChild();

  return (
    <Container.Full className="pt-0">
      <div className="flex items-center gap-2 pt-4">
        <H2 className="text-2xl">
          {commonText.colonLine({
            label: welcomeText.schemaVersion(),
            value: getSystemInfo().schema_version,
          })}
        </H2>
        <span className="-ml-2 flex-1" />
        <Link.Blue
          className="print:hidden"
          download
          href="/context/datamodel.json"
        >
          {schemaText.downloadAsJson()}
        </Link.Blue>
        <Link.Blue
          className="print:hidden"
          download
          href="/static/config/specify_datamodel.xml"
        >
          {schemaText.downloadAsXml()}
        </Link.Blue>
        <Button.Blue
          className="print:hidden"
          onClick={(): void =>
            void downloadFile(
              `${schemaText.schemaExportFileName()} - v${
                getSystemInfo().schema_version
              }.tsv`,
              schemaToTsv()
            ).catch(softFail)
          }
        >
          {schemaText.downloadAsTsv()}
        </Button.Blue>
      </div>
      <div className="relative flex flex-1 gap-6 overflow-hidden md:flex-row">
        <SchemaViewerAside activeCategory={visibleChild} />
        <div
          className="ml-2 flex flex-col gap-2 overflow-y-auto"
          ref={scrollContainerRef}
        >
          <div id={schemaViewerTopId}>
            <SchemaViewerTableList
              data={tables}
              getLink={({ name }): string => `#${name[0]}`}
              headers={schemaViewerTableColumns()}
              sortName="schemaViewerTables"
            />
          </div>
          {tables.map(({ name }, index) => (
            <SchemaViewerTable
              forwardRef={forwardRefs?.bind(undefined, index)}
              key={index}
              tableName={name[0] as keyof Tables}
            />
          ))}
        </div>
      </div>
    </Container.Full>
  );
}
