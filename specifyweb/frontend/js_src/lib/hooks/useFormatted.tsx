import React from 'react';

import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { resourceOn } from '../components/DataModel/resource';
import { softFail } from '../components/Errors/Crash';
import { format } from '../components/Forms/dataObjFormatters';
import { f } from '../utils/functools';

export function useFormatted(
  resource: SpecifyResource<AnySchema>
): string | undefined {
  const [formatted, setFormatted] = React.useState<string | undefined>(
    undefined
  );

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
    [resource]
  );
  return formatted;
}
