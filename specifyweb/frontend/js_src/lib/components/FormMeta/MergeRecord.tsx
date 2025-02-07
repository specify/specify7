import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useIsModified } from '../../hooks/useIsModified';
import { formsText } from '../../localization/forms';
import { mergingText } from '../../localization/merging';
import { f } from '../../utils/functools';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { mergingQueryParameter } from '../Merging/queryString';
import { formatUrl } from '../Router/queryString';
import { OverlayLocation } from '../Router/Router';
import { SearchDialog } from '../SearchDialog';

export function MergeRecord({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const isModified = useIsModified(resource);
  const [isOpen, handleOpen, handleClose] = useBooleanState();

  const navigate = useNavigate();

  const [rawRecordSetId] = useSearchParameter('recordsetid');
  const recordSetId = f.parseInt(rawRecordSetId);

  const overlayLocation = React.useContext(OverlayLocation);
  const [records = ''] = useSearchParameter(
    mergingQueryParameter,
    overlayLocation
  );
  const ids = React.useMemo(
    () => filterArray(records.split(',').map(f.parseInt)),
    [records]
  );

  const table = resource.specifyTable;
  React.useEffect(() => {
    if (ids.length === 1)
      navigate(getResourceViewUrl(table.name, ids[0], recordSetId));
  }, [ids, navigate, recordSetId, table]);

  return (
    <>
      <Button.Small
        disabled={isModified || resource.isNew()}
        title={isModified ? formsText.saveRecordFirst() : undefined}
        onClick={handleOpen}
      >
        {mergingText.mergeRecords()}
      </Button.Small>
      {isOpen && (
        <SearchDialog
          extraFilters={[
            {
              field: 'id',
              isRelationship: false,
              operation: 'in',
              isNot: true,
              value: resource.id.toString(),
            },
          ]}
          forceCollection={undefined}
          multiple
          table={table}
          onClose={handleClose}
          onSelected={(resources): void =>
            navigate(
              formatUrl(`/specify/overlay/merge/${table.name}`, {
                [mergingQueryParameter]: [
                  resource.id,
                  ...resources.map(({ id }) => id),
                ].join(','),
              })
            )
          }
        />
      )}
    </>
  );
}
