import React from 'react';

import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { Label, Select } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import { strictGetTable, tables } from '../DataModel/tables';
import { XmlEditorShell } from '../Formatters/Element';
import { ResourcePreview } from '../Formatters/Preview';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { WebLinkDefinition } from './Definition';
import type { WebLinkOutlet } from './Editor';
import type { WebLink } from './spec';

export function WebLinkWrapper(): JSX.Element {
  const isReaOnly = React.useContext(ReadOnlyContext);
  return (
    <XmlEditorShell<WebLink, WebLinkOutlet> header={schemaText.webLink()}>
      {({ item: [item, setItem] }): JSX.Element => (
        <>
          <Label.Block>
            {schemaText.description()}
            <AutoGrowTextArea
              isReadOnly={isReaOnly}
              value={item.description}
              onValueChange={(description): void =>
                setItem({ ...item, description })
              }
            />
          </Label.Block>
          <Label.Block>
            {schemaText.table()}
            <Select
              disabled={isReaOnly}
              value={item.table?.name ?? ''}
              onValueChange={(tableName): void =>
                setItem({ ...item, table: strictGetTable(tableName) })
              }
            >
              <option value="">{schemaText.withoutTable()}</option>
              {Object.values(tables).map(({ name, label }) => (
                <option key={name} value={name}>
                  {label}
                </option>
              ))}
            </Select>
          </Label.Block>
          <WebLinkDefinition item={[item, setItem]} />
          <WebLinkFormatting item={item} />
        </>
      )}
    </XmlEditorShell>
  );
}

function WebLinkFormatting({
  item,
}: {
  readonly item: WebLink;
}): JSX.Element | null {
  return typeof item.table === 'object' ? (
    <ResourcePreview
      doFormatting={async (resources): Promise<RA<string>> =>
        // FIXME: render a WebLink instead
        resources.map((resource) => item.url ?? '')
      }
      table={item.table}
    />
  ) : null;
}
