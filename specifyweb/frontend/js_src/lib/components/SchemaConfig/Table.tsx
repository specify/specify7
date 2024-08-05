import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { appResourceIds } from '../../utils/ajax/helpers';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getTable, tables } from '../DataModel/tables';
import type { SpLocaleContainer } from '../DataModel/types';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { PickList } from './Components';
import { SchemaConfigColumn } from './Fields';
import type { NewSpLocaleItemString, SpLocaleItemString } from './index';
import type { SchemaData } from './schemaData';

export const maxSchemaValueLength = getField(
  tables.SpLocaleItemStr,
  'text'
).length;

export function SchemaConfigTable({
  schemaData,
  container,
  name,
  desc,
  onChange: handleChange,
  onChangeName: handleChangeName,
  onChangeDesc: handleChangeDesc,
}: {
  readonly schemaData: SchemaData;
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly onChange: (container: SerializedResource<SpLocaleContainer>) => void;
  readonly name: NewSpLocaleItemString | SpLocaleItemString | undefined;
  readonly onChangeName: (
    containerName: NewSpLocaleItemString | SpLocaleItemString
  ) => void;
  readonly desc: NewSpLocaleItemString | SpLocaleItemString | undefined;
  readonly onChangeDesc: (
    containerName: NewSpLocaleItemString | SpLocaleItemString
  ) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <SchemaConfigColumn
      header={commonText.colonLine({
        label: schemaText.table(),
        value: container.name,
      })}
    >
      <Label.Block>
        {schemaText.caption()}
        <Input.Text
          isReadOnly={isReadOnly || name === undefined}
          maxLength={maxSchemaValueLength}
          required
          value={name?.text ?? ''}
          onValueChange={(text): void => handleChangeName({ ...name!, text })}
        />
      </Label.Block>
      <Label.Block>
        {schemaText.description()}
        <AutoGrowTextArea
          className="resize-y"
          isReadOnly={isReadOnly || desc === undefined}
          maxLength={maxSchemaValueLength}
          value={desc?.text ?? ''}
          onValueChange={(text): void => handleChangeDesc({ ...desc!, text })}
        />
      </Label.Block>
      <FormatterPicker
        container={container}
        schemaData={schemaData}
        type="format"
        onChange={(format): void => handleChange({ ...container, format })}
      />
      <FormatterPicker
        container={container}
        schemaData={schemaData}
        type="aggregator"
        onChange={(aggregator): void =>
          handleChange({ ...container, aggregator })
        }
      />
      <Label.Block>
        <Link.Small
          href={`/specify/overlay/configure/uniqueness/${container.name}`}
        >
          {schemaText.uniquenessRules()}
        </Link.Small>
      </Label.Block>
      <Label.Inline>
        <Input.Checkbox
          checked={container.isHidden}
          isReadOnly={isReadOnly}
          onValueChange={(isHidden): void =>
            handleChange({ ...container, isHidden })
          }
        />
        {schemaText.hideTable()}
      </Label.Inline>
    </SchemaConfigColumn>
  );
}

function FormatterPicker({
  schemaData,
  container,
  type,
  onChange: handleChange,
}: {
  readonly schemaData: SchemaData;
  readonly type: 'aggregator' | 'format';
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly onChange: (aggregator: string | null) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const kind = type === 'format' ? 'formatters' : 'aggregators';
  const table = getTable(container.name);
  const formatters = Object.fromEntries(
    schemaData[kind]
      .filter(({ tableName }) => tableName === table?.name)
      .map(({ name, title }) => [name, title] as const)
  );
  const formatterName = container[type];
  const navigate = useNavigate();

  /*
   * This is undefined if browser cached app resource response since before
   * back-end begun sending app resource ids.
   * FIXME: handle that case by re-fetching (or creating a resource if needed)
   */
  const resourceId = appResourceIds.DataObjFormatters;
  const urlPart = type === 'format' ? 'formatter' : 'aggregator';
  const index = schemaData[kind].find(
    (formatter) =>
      formatter.name === formatterName && formatter.tableName === table?.name
  )?.index;

  return (
    <Label.Block>
      {type === 'format'
        ? schemaText.tableFormat()
        : schemaText.tableAggregation()}
      <div className="flex">
        <PickList
          disabled={isReadOnly}
          groups={{
            '': formatters,
          }}
          value={formatterName}
          onChange={handleChange}
        />
        {typeof resourceId === 'number' && typeof table === 'object' ? (
          <>
            {typeof index === 'number' && (
              <Link.Icon
                className={className.dataEntryEdit}
                href={`/specify/resources/app-resource/${resourceId}/${urlPart}/${table.name}/${index}/`}
                icon="pencil"
                title={commonText.edit()}
                onClick={(event): void => {
                  event.preventDefault();
                  navigate(
                    `/specify/overlay/resources/app-resource/${resourceId}/${urlPart}/${table.name}/${index}/`
                  );
                }}
              />
            )}
            <Link.Icon
              className={className.dataEntryAdd}
              href={`/specify/resources/app-resource/${resourceId}/${urlPart}/${table.name}/`}
              icon="plus"
              title={commonText.add()}
              onClick={(event): void => {
                event.preventDefault();
                navigate(
                  `/specify/overlay/resources/app-resource/${resourceId}/${urlPart}/${table.name}/`
                );
              }}
            />
          </>
        ) : undefined}
      </div>
    </Label.Block>
  );
}
