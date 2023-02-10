import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import { Link } from '../Atoms/Link';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn, strictParseResourceUrl } from '../DataModel/resource';
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
  asLink = true,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fallback?: LocalizedString;
  readonly asLink?: boolean;
}): JSX.Element | null {
  const [formatted, setFormatted] = React.useState<string>(fallback);

  React.useEffect(
    () =>
      resourceOn(
        resource,
        'change',
        () =>
          void format(resource, undefined, true)
            .then((formatted) => f.maybe(formatted, setFormatted))
            .catch(softFail),
        true
      ),
    [resource, fallback]
  );

  return typeof resource === 'object' &&
    hasTablePermission(resource.specifyModel.name, 'read') &&
    asLink &&
    !resource.isNew() ? (
    <Link.NewTab href={resource.viewUrl()}>{formatted}</Link.NewTab>
  ) : (
    <>{formatted}</>
  );
}
