import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useFormatted } from '../../hooks/useFormatted';
import { commonText } from '../../localization/common';
import { Link } from '../Atoms/Link';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { strictParseResourceUrl } from '../DataModel/resource';
import { strictGetModel } from '../DataModel/schema';
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
  asLink = true,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fallback?: LocalizedString;
  readonly asLink?: boolean;
}): JSX.Element | null {
  const formatted = useFormatted(resource) ?? fallback;

  return typeof resource === 'object' &&
    hasTablePermission(resource.specifyModel.name, 'read') &&
    asLink &&
    !resource.isNew() ? (
    <Link.NewTab href={resource.viewUrl()}>{formatted}</Link.NewTab>
  ) : (
    <>{formatted}</>
  );
}
