import React from 'react';

import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import type { RA, RR } from '../../utils/types';
import { ensure } from '../../utils/types';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { TableIcon } from '../Molecules/TableIcon';
import { localizedRelationshipTypes } from '../SchemaConfig/helpers';
import type { Row, Value } from './helpers';
import { booleanFormatter } from './helpers';
import { TableList } from './TableList';

export function DataModelRelationships({
  model,
}: {
  readonly model: SpecifyModel;
}): JSX.Element {
  const data = React.useMemo(() => getRelationships(model), [model]);

  const [dependentFilter, setDependentFilter] = React.useState<
    boolean | undefined
  >(undefined);

  const filteredDependentData = React.useMemo(
    () =>
      typeof dependentFilter === 'boolean'
        ? data.filter(
            (relationship: { readonly name: string }) =>
              model.strictGetRelationship(relationship.name).isDependent() ===
              dependentFilter
          )
        : data,
    [dependentFilter]
  );

  return (
    <>
      <div className="flex items-center gap-4">
        <H3 id={model.name.toLowerCase()}>{schemaText.relationships()}</H3>
        <div className="flex items-center gap-2">
          <Button.Small
            aria-pressed={
              dependentFilter === true || dependentFilter === undefined
            }
            onClick={(): void =>
              setDependentFilter(
                dependentFilter === undefined
                  ? true
                  : dependentFilter
                  ? undefined
                  : true
              )
            }
          >
            {schemaText.dependent()}
          </Button.Small>
          <Button.Small
            aria-pressed={
              dependentFilter === false || dependentFilter === undefined
            }
            onClick={(): void =>
              setDependentFilter(
                dependentFilter === undefined
                  ? false
                  : dependentFilter
                  ? false
                  : undefined
              )
            }
          >
            {schemaText.independent()}
          </Button.Small>
        </div>
      </div>
      <TableList
        data={filteredDependentData}
        getLink={({ relatedModel }): string => `#${relatedModel?.[0]}`}
        headers={relationshipColumns()}
        sortName="dataModelRelationships"
      />
    </>
  );
}

const relationshipColumns = f.store(
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
      databaseColumn: schemaText.databaseColumn(),
      relatedModel: schemaText.relatedModel(),
      otherSideName: schemaText.otherSideName(),
      isDependent: schemaText.dependent(),
    } as const)
);

const getRelationships = (model: SpecifyModel) =>
  ensure<RA<Row<RR<keyof ReturnType<typeof relationshipColumns>, Value>>>>()(
    model.relationships.map(
      (field) =>
        ({
          name: field.name,
          label: field.label,
          description: field.getLocalizedDesc(),
          isHidden: booleanFormatter(field.isHidden),
          isReadOnly: booleanFormatter(field.isReadOnly),
          isRequired: booleanFormatter(field.isRequired),
          type: localizedRelationshipTypes[field.type] ?? field.type,
          databaseColumn: field.databaseColumn,
          relatedModel: [
            field.relatedModel.name.toLowerCase(),
            <>
              <TableIcon label={false} name={field.relatedModel.name} />
              {field.relatedModel.name}
            </>,
          ],
          otherSideName: field.otherSideName,
          isDependent: booleanFormatter(field.isDependent()),
        } as const)
    )
  );
