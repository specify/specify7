import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { schemaText } from '../../localization/schema';
import { syncFieldFormat } from '../../utils/fieldFormat';
import { f } from '../../utils/functools';
import { resolveParser } from '../../utils/parser/definitions';
import { ensure, IR, RA, RR } from '../../utils/types';
import { formatNumber } from '../Atoms/Internationalization';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import { TableIcon } from '../Molecules/TableIcon';

export type Value =
  | number
  | string
  | readonly [number | string | undefined, JSX.Element]
  | undefined;
export type Row<SHAPE extends IR<Value>> = SHAPE;

const parser = f.store(() =>
  resolveParser(
    {},
    {
      type: 'java.lang.Boolean',
    }
  )
);

export const booleanFormatter = (value: boolean): string =>
  syncFieldFormat(undefined, parser(), value);

export const tableColumns = f.store(
  () =>
    ({
      name: getField(schema.models.SpLocaleContainer, 'name').label,
      label: schemaText.fieldLabel(),
      isSystem: getField(schema.models.SpLocaleContainer, 'isSystem').label,
      isHidden: getField(schema.models.SpLocaleContainer, 'isHidden').label,
      tableId: schemaText.tableId(),
      fieldCount: schemaText.fieldCount(),
      relationshipCount: schemaText.relationshipCount(),
    } as const)
);

export const getTables = () =>
  ensure<RA<Row<RR<keyof ReturnType<typeof tableColumns>, Value>>>>()(
    Object.values(schema.models).map(
      (model) =>
        ({
          name: [
            model.name.toLowerCase(),
            <>
              <TableIcon label={false} name={model.name} />
              {model.name}
            </>,
          ],
          label: model.label,
          isSystem: booleanFormatter(model.isSystem),
          isHidden: booleanFormatter(model.isHidden),
          tableId: [
            model.tableId,
            <span className="flex w-full justify-end tabular-nums">
              {model.tableId}
            </span>,
          ],
          fieldCount: [
            model.fields.length,
            <span className="flex w-full justify-end tabular-nums">
              {formatNumber(model.fields.length)}
            </span>,
          ],
          relationshipCount: [
            model.relationships.length,
            <span className="flex w-full justify-end tabular-nums">
              {formatNumber(model.relationships.length)}
            </span>,
          ],
        } as const)
    )
  );

export function DataModelRedirect(): null {
  const { tableName = '' } = useParams();
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(`/specify/data-model/#${tableName}`, { replace: true });
  }, []);
  return null;
}
