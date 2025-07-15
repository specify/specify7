import React from 'react';

import { useDistantRelated } from '../../hooks/resource';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { Label, Select } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables, strictGetTable } from '../DataModel/tables';
import { ResourceMapping } from '../Formatters/Components';
import { XmlEditorShell } from '../Formatters/Element';
import { useResourcePreview } from '../Formatters/Preview';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { WebLinkDefinition } from './Definition';
import type { WebLinkOutlet } from './Editor';
import { WebLinkField } from './index';
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
                setItem({
                  ...item,
                  table:
                    tableName === '' ? undefined : strictGetTable(tableName),
                })
              }
            >
              <option value="">{schemaText.withoutTable()}</option>
              {Object.values(genericTables).map(({ name, label }) => (
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
  const hasThis = item.parts.some(({ type }) => type === 'ThisField');
  const thisField = React.useState<RA<LiteralField | Relationship> | undefined>(
    undefined
  );
  const openIndex = React.useState<number | undefined>(undefined);
  return typeof item.table === 'object' ? (
    <>
      {hasThis && (
        <Label.Block>
          {resourcesText.thisFieldName()}
          <ResourceMapping
            mapping={thisField}
            openIndex={openIndex}
            table={item.table}
          />
        </Label.Block>
      )}
      <WebLinkPreviews
        item={item}
        table={item.table}
        thisField={thisField[0]}
      />
    </>
  ) : null;
}

function WebLinkPreviews({
  thisField,
  table,
  item,
}: {
  readonly thisField: RA<LiteralField | Relationship> | undefined;
  readonly table: SpecifyTable;
  readonly item: WebLink;
}): JSX.Element {
  const { children } = useResourcePreview(table);
  return children((resource) => (
    <WebLinkPreview field={thisField} item={item} resource={resource} />
  ));
}

function WebLinkPreview({
  resource,
  field,
  item,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly field: RA<LiteralField | Relationship> | undefined;
  readonly item: WebLink;
}): JSX.Element | null {
  const data = useDistantRelated(resource, field);
  return (
    <WebLinkField
      field={data?.field}
      formType="form"
      icon="WebLink"
      id={undefined}
      name={undefined}
      resource={data?.resource}
      webLink={item}
    />
  );
}
