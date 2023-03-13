import React from 'react';
import type { State } from 'typesafe-reducer';

import { useId } from '../../hooks/useId';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { reportsText } from '../../localization/report';
import type { IR, RA } from '../../utils/types';
import { replaceItem, replaceKey } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getModelById } from '../DataModel/schema';
import type { SpQuery } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { QueryFields } from '../QueryBuilder/Fields';
import type { QueryField } from '../QueryBuilder/helpers';
import { parseQueryFields, unParseQueryFields } from '../QueryBuilder/helpers';
import { RunReport } from './Run';

export function QueryParametersDialog({
  query,
  recordSetId,
  definition,
  parameters,
  autoRun,
  onClose: handleClose,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly recordSetId: number | undefined;
  readonly definition: Document;
  readonly parameters: IR<string>;
  readonly autoRun: boolean;
  readonly onClose: () => void;
}): JSX.Element {
  const model = getModelById(query.contextTableId);

  const [fields, setFields] = useLiveState<RA<QueryField>>(
    React.useCallback(() => parseQueryFields(query.fields), [query])
  );
  const id = useId('report-query');
  const [state, setState] = useLiveState<
    | State<
        'Running',
        {
          /*
           * This query here may be different from the one passed as a prop
           * since user can modify filters
           */
          readonly query: SerializedResource<SpQuery>;
        }
      >
    | State<'Main'>
  >(
    React.useCallback(
      () =>
        autoRun
          ? {
              type: 'Running',
              query,
            }
          : { type: 'Main' },
      [autoRun, query]
    )
  );

  return state.type === 'Running' ? (
    <RunReport
      definition={definition}
      parameters={parameters}
      query={state.query}
      recordSetId={recordSetId}
      onClose={(): void => setState({ type: 'Main' })}
    />
  ) : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{reportsText.runReport()}</Submit.Blue>
        </>
      }
      dimensionsKey="ReportParameters"
      header={query.name ?? reportsText.reports()}
      icon={<span className="text-blue-500">{icons.documentReport}</span>}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          setState({
            type: 'Running',
            query: replaceKey(
              query,
              'fields',
              unParseQueryFields(model.name, fields)
            ),
          })
        }
      >
        <QueryFields
          baseTableName={model.name}
          enforceLengthLimit={false}
          fields={fields}
          getMappedFields={() => []}
          openedElement={undefined}
          showHiddenFields={false}
          onChangeField={(line, field): void =>
            setFields(replaceItem(fields, line, field))
          }
          onClose={undefined}
          onLineFocus={undefined}
          onLineMove={undefined}
          onMappingChange={undefined}
          onOpen={undefined}
          onOpenMap={undefined}
          onRemoveField={undefined}
        />
      </Form>
    </Dialog>
  );
}
