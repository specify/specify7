import React from 'react';

import type { IR } from '../../utils/types';
import { replaceKey } from '../../utils/utils';
import { serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpQuery } from '../DataModel/types';
import { userPreferences } from '../Preferences/userPreferences';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { RunReport } from './Run';

export function ReportForRecord({
  query: rawQuery,
  parameters,
  definition,
  model,
  resourceId,
  onClose: handleClose,
}: {
  readonly query: SerializedResource<SpQuery>;
  readonly definition: Document;
  readonly parameters: IR<string>;
  readonly model: SpecifyModel;
  readonly resourceId: number;
  readonly onClose: () => void;
}): JSX.Element {
  const [clearQueryFilters] = userPreferences.use(
    'reports',
    'behavior',
    'clearQueryFilters'
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
    const newField = QueryFieldSpec.fromPath(model.name, [model.idField.name])
      .toSpQueryField()
      .set('operStart', queryFieldFilters.equal.id)
      .set('startValue', resourceId.toString())
      .set('position', query.fields.length)
      .set('query', query.resource_uri);
    return replaceKey(query, 'fields', [
      ...query.fields,
      serializeResource(newField),
    ]);
  }, [rawQuery, model, resourceId, clearQueryFilters]);

  return (
    <RunReport
      definition={definition}
      parameters={parameters}
      query={query}
      recordSetId={undefined}
      onClose={handleClose}
    />
  );
}
