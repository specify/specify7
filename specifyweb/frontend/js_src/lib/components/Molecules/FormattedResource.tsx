import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { Link } from '../Atoms/Link';
import { strictParseResourceUrl } from '../DataModel/resource';
import { strictGetModel } from '../DataModel/schema';
import { softFail } from '../Errors/Crash';
import { format } from '../Formatters/formatters';
import { hasTablePermission } from '../Permissions/helpers';

export function FormattedResource({
  resourceUrl,
  fallback = commonText.loading(),
}: {
  readonly resourceUrl: string;
  readonly fallback?: LocalizedString;
}): JSX.Element | null {
  const resource = React.useMemo(() => {
    const [tableName, id] = strictParseResourceUrl(resourceUrl);
    const model = strictGetModel(tableName);
    return new model.Resource({ id });
  }, [resourceUrl]);
  const [formatted = fallback] = useAsyncState(
    React.useCallback(
      async () => format(resource, undefined, true).catch(softFail),
      [resource]
    ),
    false
  );
  return typeof resource === 'object' &&
    hasTablePermission(resource.specifyModel.name, 'read') ? (
    <Link.Default href={resource.viewUrl()}>{formatted}</Link.Default>
  ) : (
    <>{formatted}</>
  );
}
