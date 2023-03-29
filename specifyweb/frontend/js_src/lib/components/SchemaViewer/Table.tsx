import React from 'react';

import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import { booleanFormatter } from '../../utils/parser/parse';
import type { RA, RR } from '../../utils/types';
import { ensure } from '../../utils/types';
import { H2 } from '../Atoms';
import { formatNumber } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { getField } from '../DataModel/helpers';
import { getModel, schema } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { SchemaViewerFields } from './Fields';
import type { SchemaViewerRow, SchemaViewerValue } from './helpers';
import { schemaViewerTopId } from './index';
import { SchemaViewerRelationships } from './Relationships';

export function SchemaViewerTable({
  tableName,
  forwardRef,
}: {
  readonly tableName: keyof Tables;
  readonly forwardRef?: (element: HTMLElement | null) => void;
}): JSX.Element {
  const model = getModel(tableName);
  return model === undefined ? (
    <NotFoundView />
  ) : (
    <section
      className="flex flex-col gap-4 print:m-8 print:text-xs"
      ref={forwardRef}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <TableIcon label={false} name={model.name} />
          <H2 className="text-2xl" id={model.name.toLowerCase()}>
            {model.name}
          </H2>
        </div>
        <Link.Default href={`#${schemaViewerTopId}`}>
          {schemaText.goToTop()}
        </Link.Default>
      </div>
      <SchemaViewerFields table={model} />
      <SchemaViewerRelationships table={model} />
    </section>
  );
}

export const schemaViewerTableColumns = f.store(
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

export const getSchemaViewerTables = () =>
  ensure<
    RA<
      SchemaViewerRow<
        RR<keyof ReturnType<typeof schemaViewerTableColumns>, SchemaViewerValue>
      >
    >
  >()(
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
            <span className="flex w-full justify-end tabular-nums" key="">
              {model.tableId}
            </span>,
          ],
          fieldCount: [
            model.fields.length,
            <span className="flex w-full justify-end tabular-nums" key="">
              {formatNumber(model.fields.length)}
            </span>,
          ],
          relationshipCount: [
            model.relationships.length,
            <span className="flex w-full justify-end tabular-nums" key="">
              {formatNumber(model.relationships.length)}
            </span>,
          ],
        } as const)
    )
  );
