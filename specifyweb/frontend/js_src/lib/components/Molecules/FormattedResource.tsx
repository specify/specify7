import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { Link } from '../Atoms/Link';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { strictParseResourceUrl } from '../DataModel/resource';
import { strictGetModel } from '../DataModel/schema';
import { softFail } from '../Errors/Crash';
import { format } from '../Forms/dataObjFormatters';
import { hasTablePermission } from '../Permissions/helpers';

export function FormattedResourceUrl({
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
  return <FormattedResource fallback={fallback} resource={resource} />;
}

export function FormattedResource({
  resource,
  fallback = commonText.loading(),
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fallback?: string;
}): JSX.Element {
  const [formatted = fallback] = useAsyncState(
    React.useCallback(
      async () => format(resource, undefined, true).catch(softFail),
      [resource]
    ),
    false
  );
  return typeof resource === 'object' &&
    hasTablePermission(resource.specifyModel.name, 'read') ? (
    <Link.NewTab href={resource.viewUrl()}>{formatted}</Link.NewTab>
  ) : (
    <>{formatted}</>
  );
}
