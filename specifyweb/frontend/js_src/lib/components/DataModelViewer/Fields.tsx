import React from 'react';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import { ensure, RA, RR } from '../../utils/types';
import { H3 } from '../Atoms';
import { formatNumber } from '../Atoms/Internationalization';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import { SpecifyModel } from '../DataModel/specifyModel';
import { javaTypeToHuman } from '../SchemaConfig/helpers';
import { booleanFormatter, Row, Value } from './helpers';
import { TableList } from './TableList';

export function DataModelFields({
  model,
}: {
  readonly model: SpecifyModel;
}): JSX.Element {
  const data = React.useMemo(() => getFields(model), [model]);
  const scope = model.getScopingRelationship()?.relatedModel.name;

  return (
    <>
      <p>
        {commonText.colonLine({
          label: schemaText.idField(),
          value: model.idField.name,
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
      <TableList
        data={data}
        getLink={undefined}
        headers={fieldColumns()}
        sortName="dataModelFields"
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

const getFields = (model: SpecifyModel) =>
  ensure<RA<Row<RR<keyof ReturnType<typeof fieldColumns>, Value>>>>()(
    model.literalFields.map(
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
            <span className="flex w-full justify-end tabular-nums">
              {f.maybe(field.length, formatNumber)}
            </span>,
          ],
          databaseColumn: field.databaseColumn,
        } as const)
    )
  );
