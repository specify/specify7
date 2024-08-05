import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetSet, RA } from '../../utils/types';
import { ErrorMessage } from '../Atoms';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { hasTablePermission } from '../Permissions/helpers';
import { ResourceMapping } from './Components';
import { Definitions } from './Definitions';
import { fetchPathAsString, format } from './formatters';
import { ResourcePreview } from './Preview';
import type { Formatter } from './spec';

export function FormatterElement({
  item: [formatter, setFormatter],
}: {
  readonly item: GetSet<Formatter>;
}): JSX.Element {
  return (
    <>
      {typeof formatter.table === 'object' && (
        <ConditionalMapping item={[formatter, setFormatter]} />
      )}
      {formatter.definition.external === undefined ? (
        <Definitions item={[formatter, setFormatter]} />
      ) : (
        <ErrorMessage>{resourcesText.editorNotAvailable()}</ErrorMessage>
      )}
      <FormatterPreview formatter={formatter} />
    </>
  );
}

function ConditionalMapping({
  item: [formatter, setFormatter],
}: {
  readonly item: GetSet<Formatter>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);

  const [openIndex, setOpenIndex] = React.useState<number | undefined>(
    undefined
  );

  const [isConditionFieldDisplayed, setIsConditionFieldDisplayed] =
    useTriggerState(formatter.definition.conditionField !== undefined);

  function setConditionField(): void {
    setIsConditionFieldDisplayed(!isConditionFieldDisplayed);
    setFormatter({
      ...formatter,
      definition: {
        ...formatter.definition,
        conditionField: undefined,
        fields: [],
      },
    });
  }

  return (
    <fieldset>
      <Label.Inline>
        <Input.Checkbox
          checked={
            isConditionFieldDisplayed ||
            formatter.definition.conditionField !== undefined
          }
          isReadOnly={isReadOnly}
          onChange={setConditionField}
        />
        {resourcesText.conditionalFormatter()}
      </Label.Inline>
      {isConditionFieldDisplayed && typeof formatter.table === 'object' ? (
        <ResourceMapping
          mapping={[
            formatter.definition.conditionField,
            (conditionField): void => {
              setFormatter({
                ...formatter,
                definition: {
                  ...formatter.definition,
                  conditionField,
                },
              });
            },
          ]}
          openIndex={[openIndex, setOpenIndex]}
          table={formatter.table}
        />
      ) : null}
    </fieldset>
  );
}

function FormatterPreview({
  formatter,
}: {
  readonly formatter: Formatter;
}): JSX.Element | null {
  const doFormatting = React.useCallback(
    async (resources: RA<SpecifyResource<AnySchema>>) =>
      Promise.all(
        resources.map(async (resource) =>
          f
            .all({
              formatted: format(resource, formatter, false),
              condition:
                formatter.definition.conditionField === undefined
                  ? undefined
                  : fetchPathAsString(
                      resource,
                      formatter.definition.conditionField,
                      false
                    ),
            })
            .then(({ formatted, condition }) =>
              `${formatted ?? ''}\n${
                condition === undefined
                  ? ''
                  : commonText.colonLine({
                      label: resourcesText.conditionFieldValue(),
                      value: condition,
                    })
              }`.trim()
            )
        )
      ),
    [formatter]
  );
  return typeof formatter.table === 'object' &&
    hasTablePermission(formatter.table.name, 'read') ? (
    <ResourcePreview doFormatting={doFormatting} table={formatter.table} />
  ) : null;
}
