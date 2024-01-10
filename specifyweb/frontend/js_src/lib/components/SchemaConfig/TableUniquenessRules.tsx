import React from 'react';
import { useParams } from 'react-router-dom';

import { useUnloadProtect } from '../../hooks/navigation';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { schema, strictGetModel } from '../DataModel/schema';
import type { RelationshipType } from '../DataModel/specifyField';
import type { UniquenessRule } from '../DataModel/uniquenessRules';
import {
  getUniquenessRules,
  useTableUniquenessRules,
  validateUniqueness,
} from '../DataModel/uniquenessRules';
import { Dialog } from '../Molecules/Dialog';
import { hasToolPermission } from '../Permissions/helpers';
import { OverlayContext, UnloadProtectDialog } from '../Router/Router';
import { UniquenessRuleRow } from './UniquenessRuleRow';

export function TableUniquenessRules(): JSX.Element {
  const isReadOnly =
    !hasToolPermission('schemaConfig', 'update') ||
    !hasToolPermission('schemaConfig', 'create');

  const { tableName = '' } = useParams();
  const model = strictGetModel(tableName);

  const [tableRules = [], setTableRules, setStoredTableRules] =
    useTableUniquenessRules(model.name);

  const id = useId('uniqueness-rules');
  const formId = id('form');

  const loading = React.useContext(LoadingContext);
  const handleClose = React.useContext(OverlayContext);

  const [storedInitialRules, setStoredInitialRules] = React.useState(
    getUniquenessRules(model.name)
  );

  const changesMade = React.useMemo(
    () => JSON.stringify(tableRules) !== JSON.stringify(storedInitialRules),
    [storedInitialRules, tableRules]
  );

  const [unloadProtected, setUnloadProtected] = React.useState(false);
  useUnloadProtect(changesMade, mainText.leavePageConfirmationDescription());

  const saveBlocked = React.useMemo(
    () => tableRules.some(({ duplicates }) => duplicates.totalDuplicates !== 0),
    [tableRules]
  );

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
          model.name,
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
    [loading, model.name, tableRules, setTableRules]
  );

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const SaveButton = saveBlocked ? Submit.Red : Submit.Save;

  return (
    <Dialog
      buttons={
        <>
          <Button.Secondary
            onClick={(): void => {
              if (changesMade) setUnloadProtected(true);
              else handleClose();
            }}
          >
            {commonText.close()}
          </Button.Secondary>
          <SaveButton disabled={!changesMade} form={formId}>
            {commonText.save()}
          </SaveButton>
        </>
      }
      header={schemaText.tableUniquenessRules({ tableName: model.name })}
      icon={saveBlocked ? 'error' : 'info'}
      modal={false}
      onClose={(): void => {
        handleClose();
      }}
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
                method: 'PUT',
                body: {
                  rules: tableRules.map(({ rule }) => rule),
                  model: model.name,
                },
              }
            ).then((): void => {
              void setStoredTableRules(tableRules);
              return void setStoredInitialRules(tableRules);
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
              isReadOnly={isReadOnly}
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
          disabled={isReadOnly}
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
      {unloadProtected && (
        <UnloadProtectDialog
          onCancel={(): void => setUnloadProtected(false)}
          onConfirm={handleClose}
        >
          {mainText.leavePageConfirmationDescription()}
        </UnloadProtectDialog>
      )}
    </Dialog>
  );
}
