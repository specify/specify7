import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { getFieldsFromPath } from '../DataModel/businessRules';
import { djangoLookupSeparator } from '../DataModel/helpers';
import type { RelationshipType } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import type { UniquenessRule } from '../DataModel/uniquenessRules';
import type { HtmlGeneratorFieldData } from '../WbPlanView/LineComponents';
import { getMappingLineProps } from '../WbPlanView/LineComponents';
import { MappingView } from '../WbPlanView/MapperComponents';
import type { MappingLineData } from '../WbPlanView/navigator';

export function UniquenessRuleScope({
  rule,
  table,
  onChange: handleChanged,
}: {
  readonly rule: UniquenessRule;
  readonly table: SpecifyTable;
  readonly onChange: (newRule: typeof rule) => void;
}): JSX.Element {
  const databaseMappingPathField = 'database';

  const [mappingPath, setMappingPath] = React.useState<RA<string>>(
    rule.scopes.length === 0
      ? [databaseMappingPathField]
      : rule.scopes[0].split(djangoLookupSeparator)
  );

  const databaseScopeData: Readonly<Record<string, HtmlGeneratorFieldData>> = {
    database: {
      isDefault: true,
      isEnabled: true,
      isRelationship: false,
      optionLabel: schemaText.database(),
    },
  };

  const getValidScopeRelationships = (
    table: SpecifyTable
  ): Readonly<Record<string, HtmlGeneratorFieldData>> =>
    Object.fromEntries(
      table.relationships
        .filter(
          (relationship) =>
            !(['one-to-many', 'many-to-many'] as RA<RelationshipType>).includes(
              relationship.type
            ) && !relationship.isVirtual
        )
        .map((relationship) => [
          relationship.name,
          {
            isDefault: false,
            isEnabled: true,
            isRelationship: true,
            optionLabel: relationship.localization.name ?? relationship.name,
            tableName: relationship.relatedTable.name,
          },
        ])
    );

  const updateLineData = (
    mappingLines: RA<MappingLineData>,
    mappingPath: RA<string>
  ): RA<MappingLineData> =>
    mappingLines.map((lineData, index) => ({
      ...lineData,
      fieldsData: Object.fromEntries(
        Object.entries(lineData.fieldsData).map(([field, data]) => [
          field,
          { ...data, isDefault: mappingPath[index] === field },
        ])
      ),
    }));

  const databaseLineData: RA<MappingLineData> = [
    {
      customSelectSubtype: 'simple',
      defaultValue: '',
      tableName: table.name,
      fieldsData: {
        ...databaseScopeData,
        ...getValidScopeRelationships(table),
      },
    },
  ];

  const [lineData, setLineData] = useLiveState<RA<MappingLineData>>(
    React.useCallback(
      () =>
        updateLineData(
          mappingPath.map((_, index) => {
            const databaseScope = index === 0 ? databaseScopeData : {};
            const tablePath =
              index === 0
                ? table
                : getFieldsFromPath(
                    table,
                    mappingPath.slice(0, index + 1).join(djangoLookupSeparator)
                  )[index].table;
            return {
              customSelectSubtype: 'simple',
              defaultValue: '',
              tableName: tablePath.name,
              fieldsData: {
                ...databaseScope,
                ...getValidScopeRelationships(tablePath),
              },
            };
          }),
          mappingPath
        ),
      [rule.scopes, table]
    )
  );

  const getRelationshipData = (newTableName: keyof Tables): MappingLineData => {
    const newTable = strictGetTable(newTableName);

    return {
      customSelectSubtype: 'simple',
      defaultValue: '',
      tableName: newTable.name,
      fieldsData: getValidScopeRelationships(newTable),
    };
  };

  return (
    <MappingView
      mappingElementProps={getMappingLineProps({
        mappingLineData: lineData,
        customSelectType: 'OPENED_LIST',
        onChange({ isDoubleClick, isRelationship, index, ...rest }) {
          if (isRelationship) {
            const newMappingPath = replaceItem(
              mappingPath.slice(0, index + 1),
              index,
              rest.newValue
            );
            setMappingPath(newMappingPath);
            setLineData((lineData) =>
              updateLineData(
                [
                  ...lineData.slice(0, index + 1),
                  getRelationshipData(rest.newTableName!),
                ],
                newMappingPath
              )
            );
            if (isDoubleClick)
              handleChanged({
                ...rule,
                scopes: [newMappingPath.join(djangoLookupSeparator)],
              });
          } else {
            setMappingPath([databaseMappingPathField]);
            setLineData(databaseLineData);
            if (isDoubleClick)
              handleChanged({
                ...rule,
                scopes: [],
              });
          }
        },
      })}
    >
      <Button.Small
        aria-label={schemaText.setScope()}
        className="justify-center p-2"
        title={schemaText.setScope()}
        onClick={(): void => {
          handleChanged({
            ...rule,
            scopes:
              mappingPath.length === 1 && mappingPath[0] === 'database'
                ? []
                : [mappingPath.join(djangoLookupSeparator)],
          });
        }}
      >
        {icons.arrowRight}
      </Button.Small>
    </MappingView>
  );
}
