import React from 'react';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import { booleanFormatter } from '../../utils/parser/parse';
import type { RA, RR } from '../../utils/types';
import { ensure } from '../../utils/types';
import { H3 } from '../Atoms';
import { formatNumber } from '../Atoms/Internationalization';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { javaTypeToHuman } from '../SchemaConfig/helpers';
import type { SchemaViewerRow, SchemaViewerValue } from './helpers';
import { SchemaViewerTableList } from './TableList';

export function SchemaViewerFields({
  table,
}: {
  readonly table: SpecifyModel;
}): JSX.Element {
  const data = React.useMemo(() => getFields(table), [table]);
  const scope = table.getScopingRelationship()?.relatedModel.name;

  return (
    <>
      <p>
        {commonText.colonLine({
          label: schemaText.idField(),
          value: table.idField.name,
        })}
      </p>
      {typeof scope === 'string' && (
        <p>
          {commonText.colonLine({
            label: schemaText.scope(),
            value: scope,
          })}
        </p>
      )}
      <H3>{schemaText.fields()}</H3>
      <SchemaViewerTableList
        data={data}
        getLink={undefined}
        headers={fieldColumns()}
        sortName="schemaViewerFields"
      />
    </>
  );
}

const fieldColumns = f.store(
  () =>
    ({
      name: getField(schema.models.SpLocaleContainerItem, 'name').label,
      label: schemaText.fieldLabel(),
      description: schemaText.description(),
      isHidden: getField(schema.models.SpLocaleContainerItem, 'isHidden').label,
      isReadOnly: schemaText.readOnly(),
      isRequired: getField(schema.models.SpLocaleContainerItem, 'isRequired')
        .label,
      type: getField(schema.models.SpLocaleContainerItem, 'type').label,
      length: schemaText.fieldLength(),
      databaseColumn: schemaText.databaseColumn(),
    } as const)
);

const getFields = (table: SpecifyModel) =>
  ensure<
    RA<
      SchemaViewerRow<
        RR<keyof ReturnType<typeof fieldColumns>, SchemaViewerValue>
      >
    >
  >()(
    table.literalFields.map(
      (field) =>
        ({
          name: field.name,
          label: field.label,
          description: field.getLocalizedDesc(),
          isHidden: booleanFormatter(field.isHidden),
          isReadOnly: booleanFormatter(field.isReadOnly),
          isRequired: booleanFormatter(field.isRequired),
          type: javaTypeToHuman(field.type, undefined),
          length: [
            field.length,
            <span className="flex w-full justify-end tabular-nums" key="">
              {f.maybe(field.length, formatNumber)}
            </span>,
          ],
          databaseColumn: field.databaseColumn,
        } as const)
    )
  );
