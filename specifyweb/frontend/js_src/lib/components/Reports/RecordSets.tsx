import React from 'react';
import type { State } from 'typesafe-reducer';

import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import type { IR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getTableById } from '../DataModel/tables';
import type { RecordSet, SpAppResource, SpQuery } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { parseSpecifyProperties } from '../FormEditor/viewSpec';
import { userInformation } from '../InitialContext/userInformation';
import { RecordSetsDialog } from '../Toolbar/RecordSets';
import { QueryParametersDialog } from './Parameters';

export function ReportRecordSets({
  query,
  appResource,
  definition,
  parameters,
  onClose: handleClose,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly appResource: SerializedResource<SpAppResource>;
  readonly definition: Element;
  readonly parameters: IR<string>;
  readonly onClose: () => void;
}): JSX.Element {
  const table = React.useMemo(
    () =>
      getTableById(
        query.contextTableId ??
          f.parseInt(parseSpecifyProperties(appResource.metaData ?? '').tableid)
      ),
    [query, appResource]
  );
  const recordSetsPromise = React.useMemo(
    async () =>
      fetchCollection('RecordSet', {
        specifyUser: userInformation.id,
        type: 0,
        domainFilter: true,
        dbTableId: table.tableId,
        limit: 500,
      }),
    [table]
  );
  React.useEffect(
    () =>
      void recordSetsPromise
        .then(({ totalCount }) =>
          totalCount === 0 ? setState({ type: 'Raw' }) : undefined
        )
        .catch(softFail),
    [recordSetsPromise]
  );
  const [state, setState] = React.useState<
    | State<
        'RecordSet',
        {
          readonly recordSet: SerializedResource<RecordSet>;
          readonly autoRun: boolean;
        }
      >
    | State<'Main'>
    | State<'Raw'>
  >({ type: 'Main' });
  return state.type === 'Main' ? (
    <ReadOnlyContext.Provider value>
      <RecordSetsDialog
        tables={table}
        onClose={handleClose}
        onConfigure={(recordSet): void =>
          setState({
            type: 'RecordSet',
            recordSet,
            autoRun: false,
          })
        }
        onSelect={(recordSet): void =>
          setState({
            type: 'RecordSet',
            recordSet,
            autoRun: true,
          })
        }
      >
        {({ children, dialog }): JSX.Element =>
          dialog(
            children,
            <Button.Info onClick={(): void => setState({ type: 'Raw' })}>
              {queryText.query()}
            </Button.Info>
          )
        }
      </RecordSetsDialog>
    </ReadOnlyContext.Provider>
  ) : (
    <QueryParametersDialog
      autoRun={state.type === 'RecordSet' && state.autoRun}
      definition={definition}
      parameters={parameters}
      query={query}
      recordSetId={state.type === 'RecordSet' ? state.recordSet.id : undefined}
      onClose={handleClose}
    />
  );
}
