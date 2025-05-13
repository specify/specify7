import React from 'react';

import type { IR } from '../../utils/types';
import { replaceKey } from '../../utils/utils';
import type { SerializedResource } from '../DataModel/helperTypes';
import { serializeResource } from '../DataModel/serializers';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpQuery } from '../DataModel/types';
import { userPreferences } from '../Preferences/userPreferences';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { useQueryFieldFilters } from '../QueryBuilder/useQueryFieldFilters';
import { QueryParametersDialog } from './Parameters';
import { RunReport } from './Run';

export function ReportForRecord({
  query: rawQuery,
  parameters,
  definition,
  table,
  resourceId,
  onClose: handleClose,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly definition: Element;
  readonly parameters: IR<string>;
  readonly table: SpecifyTable;
  readonly resourceId: number;
  readonly onClose: () => void;
}): JSX.Element {
  const queryFieldFilters = useQueryFieldFilters();

  const [clearQueryFilters] = userPreferences.use(
    'reports',
    'behavior',
    'clearQueryFilters'
  );

  const [showQueryParameters] = userPreferences.use(
    'reports',
    'behavior',
    'queryParamtersFromForm'
  );

  const query = React.useMemo(() => {
    const query = replaceKey(
      rawQuery,
      'fields',
      rawQuery.fields.map((field) =>
        field.alwaysFilter === true
          ? field
          : {
              ...field,
              operStart:
                clearQueryFilters && field.startValue === ''
                  ? queryFieldFilters.any.id
                  : field.operStart,
              startValue: clearQueryFilters ? '' : field.startValue,
              operEnd: null,
              endValue: null,
            }
      )
    );
    const newField = QueryFieldSpec.fromPath(table.name, [table.idField.name])
      .toSpQueryField()
      .set('operStart', queryFieldFilters.equal.id)
      .set('startValue', resourceId.toString())
      .set('position', query.fields.length)
      .set('query', query.resource_uri);
    return replaceKey(query, 'fields', [
      ...query.fields,
      serializeResource(newField),
    ]);
  }, [rawQuery, table, resourceId, clearQueryFilters]);

  return showQueryParameters ? (
    <QueryParametersDialog
      autoRun={false}
      definition={definition}
      parameters={parameters}
      query={query}
      recordSetId={undefined}
      onClose={handleClose}
    />
  ) : (
    <RunReport
      definition={definition}
      parameters={parameters}
      query={query}
      recordSetId={undefined}
      onClose={handleClose}
    />
  );
}
