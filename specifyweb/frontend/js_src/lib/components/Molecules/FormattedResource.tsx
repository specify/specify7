import { commonText } from '../../localization/common';
import React from 'react';
import { defined } from '../../utils/types';
import { parseResourceUrl } from '../DataModel/resource';
import { getModel } from '../DataModel/schema';
import { useAsyncState } from '../../hooks/useAsyncState';
import { format } from '../Forms/dataObjFormatters';
import { softFail } from '../Errors/Crash';
import { hasTablePermission } from '../Permissions/helpers';
import { Link } from '../Atoms/Link';

export function FormattedResource({
  resourceUrl,
  fallback = commonText('loading'),
}: {
  readonly resourceUrl: string;
  readonly fallback?: string;
}): JSX.Element | null {
  const resource = React.useMemo(() => {
    const [tableName, id] = defined(parseResourceUrl(resourceUrl));
    const model = defined(getModel(tableName));
    return new model.Resource({ id });
  }, [resourceUrl]);
  const [formatted = fallback] = useAsyncState(
    React.useCallback(async () => format(resource).catch(softFail), [resource]),
    false
  );
  return typeof resource === 'object' &&
    hasTablePermission(resource.specifyModel.name, 'read') ? (
    <Link.Default href={resource.viewUrl()}>{formatted}</Link.Default>
  ) : (
    <>{formatted}</>
  );
}
