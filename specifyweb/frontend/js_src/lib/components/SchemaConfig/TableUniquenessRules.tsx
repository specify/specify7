import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema, strictGetModel } from '../DataModel/schema';
import type { RelationshipType } from '../DataModel/specifyField';
import type { SpLocaleContainer, Tables } from '../DataModel/types';
import type { UniquenessRule } from '../DataModel/uniquenessRules';
import {
  uniquenessRules,
  useTableUniquenessRules,
  validateUniqueness,
} from '../DataModel/uniquenessRules';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import { UniquenessRuleRow } from './UniquenessRuleRow';

export function TableUniquenessRules({
  container,
  header,
  onClose: handleClose,
}: {
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly header: LocalizedString;
  readonly onClose: () => void;
}): JSX.Element {
  const model = React.useMemo(
    () => strictGetModel(container.name),
    [container]
  );

  const [tableRules = [], setTableRules, setStoredTableRules] =
    useTableUniquenessRules(model.name);

  const id = useId('uniqueness-rules');
  const formId = id('form');

  const loading = React.useContext(LoadingContext);

  const saveBlocked = React.useMemo(
    () =>
      tableRules.some(
        ({ duplicates }) =>
          duplicates !== undefined && duplicates.totalDuplicates !== 0
      ),
    [tableRules]
  );

  const [isEditing, _, __, toggleIsEditing] = useBooleanState();

  const fields = React.useMemo(
    () => model.literalFields.filter((field) => !field.isVirtual),
    [model]
  );

  const relationships = React.useMemo(
    () =>
      model.relationships.filter(
        (relationship) =>
          !(['one-to-many', 'many-to-many'] as RA<RelationshipType>).includes(
            relationship.type
          ) && !relationship.isVirtual
      ),
    [model]
  );

  const handleRuleValidation = React.useCallback(
    (newRule: UniquenessRule, index: number) => {
      const filteredRule: UniquenessRule = {
        ...newRule,
        fields: newRule.fields.filter(
          (field, index) => newRule.fields.indexOf(field) === index
        ),
        scopes: newRule.scopes.filter(
          (scope, index) => newRule.scopes.indexOf(scope) === index
        ),
      };
      loading(
        validateUniqueness(
          container.name as keyof Tables,
          filteredRule.fields as unknown as RA<never>,
          filteredRule.scopes as unknown as RA<never>
        ).then((duplicates) => {
          const isNewRule = index > tableRules.length;
          setTableRules((previous) =>
            isNewRule
              ? [...previous!, { rule: filteredRule, duplicates }]
              : replaceItem(tableRules, index, {
                  rule: filteredRule,
                  duplicates,
                })
          );

          return filteredRule;
        })
      );
    },
    [container.name, loading, tableRules, setTableRules]
  );

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const SaveButton = saveBlocked ? Submit.Red : Submit.Save;

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <SaveButton
            disabled={tableRules === uniquenessRules[model.name]}
            form={formId}
          >
            {commonText.save()}
          </SaveButton>
        </>
      }
      header={header}
      icon={saveBlocked ? 'error' : 'info'}
      modal={false}
      onClose={handleClose}
    >
      <Form
        id={formId}
        onSubmit={(): void => {
          loading(
            ajax(
              `/businessrules/uniqueness_rules/${schema.domainLevelIds.discipline}/`,
              {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                headers: { Accept: 'application/json' },
                method: tableRules.some(({ rule }) => rule.id === null)
                  ? 'POST'
                  : 'PUT',
                body: {
                  rules: tableRules.map(({ rule }) => rule),
                  model: container.name,
                },
              }
            ).then((): void => {
              setStoredTableRules(tableRules);
              return isEditing ? void toggleIsEditing() : void handleClose();
            })
          );
        }}
      >
        <table className="grid-table grid-cols-[2fr_1fr] gap-2 gap-y-4 overflow-auto">
          <thead>
            <tr>
              <td>{schemaText.uniqueFields()}</td>
              <td>{schemaText.scope()}</td>
            </tr>
          </thead>
          {tableRules?.map(({ rule, duplicates }, index) => (
            <UniquenessRuleRow
              fetchedDuplicates={duplicates}
              fields={fields}
              formId={formId}
              key={index}
              model={model}
              relationships={relationships}
              rule={rule}
              onChange={(newRule): void => handleRuleValidation(newRule, index)}
              onRemoved={(): void =>
                setTableRules(removeItem(tableRules, index))
              }
            />
          ))}
        </table>
        <Button.Small
          className="w-fit"
          disabled={!hasPermission('/schemaconfig/uniquenessrules', 'create')}
          onClick={(): void =>
            handleRuleValidation(
              {
                id: null,
                modelName: model.name,
                fields: [fields[0].name],
                isDatabaseConstraint: false,
                scopes: [],
              },
              tableRules.length
            )
          }
        >
          {schemaText.addUniquenessRule()}
        </Button.Small>
      </Form>
    </Dialog>
  );
}
