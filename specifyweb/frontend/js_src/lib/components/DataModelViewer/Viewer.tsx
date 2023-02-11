import React from 'react';
import { schemaText } from '../../localization/schema';
import { welcomeText } from '../../localization/welcome';
import { Container, H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { downloadFile } from '../Molecules/FilePicker';
import { useTopChild } from '../UserPreferences/useTopChild';
import { DataModelAside } from './Aside';
import { DataModelTable } from './Table';
import { getTables, tableColumns } from './helpers';
import { TableList } from './TableList';

export const topId = 'tables';

export function DataModelViewer(): JSX.Element {
  const tables = React.useMemo(getTables, []);
  const { visibleChild, forwardRefs, scrollContainerRef } = useTopChild();

  return (
    <Container.Full className="pt-0">
      <div className="flex items-center gap-2 pt-4">
        <H2 className="text-2xl">
          {`${welcomeText.schemaVersion()} ${getSystemInfo().schema_version}`}
        </H2>
        <span className="-ml-2 flex-1" />
        <Link.Blue
          className="print:hidden"
          download
          href="/context/datamodel.json"
        >
          {schemaText.downloadAsJson()}
        </Link.Blue>
        <Button.Blue
          className="print:hidden"
          onClick={(): void =>
            void downloadFile(
              `Specify 7 Data Model - v${getSystemInfo().schema_version}.tsv`,
              dataModelToTsv()
            ).catch(softFail)
          }
        >
          {schemaText.downloadAsTsv()}
        </Button.Blue>
      </div>
      <div className="relative flex flex-1 gap-6 overflow-hidden md:flex-row">
        <DataModelAside activeCategory={visibleChild} />
        <div
          className="ml-2 flex flex-col gap-2 overflow-y-auto"
          ref={scrollContainerRef}
        >
          <div id={topId}>
            <TableList
              data={tables}
              getLink={({ name }): string => `#${name[0]}`}
              headers={tableColumns()}
              sortName="dataModelTables"
            />
          </div>
          {tables.map(({ name }, index) => (
            <DataModelTable
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

function dataModelToTsv(): string {
  throw new Error('Function not implemented.');
}
