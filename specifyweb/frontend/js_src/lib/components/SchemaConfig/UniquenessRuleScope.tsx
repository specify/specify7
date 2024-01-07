import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { getFieldsFromPath } from '../DataModel/businessRules';
import { lookupSeparator } from '../DataModel/helpers';
import { strictGetModel } from '../DataModel/schema';
import type { RelationshipType } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Tables } from '../DataModel/types';
import type { UniquenessRule } from '../DataModel/uniquenessRules';
import type { HtmlGeneratorFieldData } from '../WbPlanView/LineComponents';
import { getMappingLineProps } from '../WbPlanView/LineComponents';
import { MappingView } from '../WbPlanView/MapperComponents';
import type { MappingLineData } from '../WbPlanView/navigator';

export function UniquenessRuleScope({
  rule,
  model,
  onChange: handleChanged,
}: {
  readonly rule: UniquenessRule;
  readonly model: SpecifyModel;
  readonly onChange: (newRule: typeof rule) => void;
}): JSX.Element {
  const [mappingPath, setMappingPath] = React.useState<RA<string>>(
    rule.scopes.length === 0
      ? ['database']
      : rule.scopes[0].split(lookupSeparator)
  );

  const getFieldPath = (): string => mappingPath.join(lookupSeparator);

  const databaseScopeData: Readonly<Record<string, HtmlGeneratorFieldData>> = {
    database: {
      isDefault: true,
      isEnabled: true,
      isRelationship: false,
      optionLabel: schemaText.database(),
    },
  };

  const getValidScopeRelationships = (
    model: SpecifyModel
  ): Readonly<Record<string, HtmlGeneratorFieldData>> =>
    Object.fromEntries(
      model.relationships
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
            optionLabel: relationship.localization.name!,
            tableName: relationship.relatedModel.name,
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
      tableName: model.name,
      fieldsData: {
        ...databaseScopeData,
        ...getValidScopeRelationships(model),
      },
    },
  ];

  const [lineData, setLineData] = useLiveState<RA<MappingLineData>>(
    React.useCallback(
      () =>
        updateLineData(
          mappingPath.map((_, index) => {
            const databaseScope = index === 0 ? databaseScopeData : {};
            const modelPath =
              index === 0
                ? model
                : getFieldsFromPath(model, rule.scopes[0])[index].model;
            return {
              customSelectSubtype: 'simple',
              tableName: modelPath.name,
              fieldsData: {
                ...databaseScope,
                ...getValidScopeRelationships(modelPath),
              },
            };
          }),
          mappingPath
        ),
      [rule, model]
    )
  );

  const getRelationshipData = (newTableName: keyof Tables): MappingLineData => {
    const newModel = strictGetModel(newTableName);

    return {
      customSelectSubtype: 'simple',
      tableName: newModel.name,
      fieldsData: getValidScopeRelationships(newModel),
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
              handleChanged({ ...rule, scopes: [getFieldPath()] });
          } else {
            setMappingPath(['database']);
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
                : [getFieldPath()],
          });
        }}
      >
        {icons.arrowRight}
      </Button.Small>
    </MappingView>
  );
}
