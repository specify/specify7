import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { AnySchema, SerializedRecord } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { formatUrl } from '../Router/queryString';

/*
 * FEATURE: consider replacing this with Query Builder
 *   Unfortunately, express search query syntax does not match query builder's
 *   syntax so behavior would differ.
 */
export const queryCbxExtendedSearch = async <SCHEMA extends AnySchema>(
  templateResource: SpecifyResource<SCHEMA>,
  forceCollection: number | undefined
): Promise<RA<SpecifyResource<SCHEMA>>> =>
  ajax<RA<SerializedRecord<SCHEMA>>>(
    formatUrl(
      `/express_search/querycbx/${templateResource.specifyTable.name.toLowerCase()}/`,
      {
        ...Object.fromEntries(
          filterArray(
            Object.entries(templateResource.toJSON()).map(([key, value]) => {
              const field = templateResource.specifyTable.getField(key);
              return field && !field.isRelationship && Boolean(value)
                ? [key, value]
                : undefined;
            })
          )
        ),
        forceCollection,
      }
    ),
    {
      headers: { Accept: 'application/json' },
    }
  ).then(({ data: results }) =>
    results.map((result) => new templateResource.specifyTable.Resource(result))
  );
