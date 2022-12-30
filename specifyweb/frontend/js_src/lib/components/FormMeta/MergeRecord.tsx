import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useIsModified } from '../../hooks/useIsModified';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { SearchDialog } from '../Forms/SearchDialog';
import { MergingDialog } from '../Merging';
import { mergingText } from '../../localization/merging';

export function MergeRecord({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const isModified = useIsModified(resource);
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const [ids, setIds] = React.useState<ReadonlySet<number>>(new Set());

  const navigate = useNavigate();
  const [recordsetid] = useSearchParameter('recordsetid');
  const recordSetId = f.parseInt(recordsetid);
  return (
    <>
      <Button.Small
        disabled={isModified || resource.isNew()}
        title={isModified ? formsText.saveRecordFirst() : undefined}
        onClick={handleOpen}
      >
        {mergingText.mergeRecords()}
      </Button.Small>
      {ids.size > 0 ? (
        <MergingDialog
          ids={ids}
          model={resource.specifyModel}
          onClose={(): void => {
            handleClose();
            setIds(new Set());
          }}
          onDeleted={(removeId): void => {
            const newItems = Array.from(ids).filter((id) => id !== removeId);
            if (newItems.length === 1) {
              navigate(
                getResourceViewUrl(
                  resource.specifyModel.name,
                  newItems[0],
                  recordSetId
                )
              );
            } else setIds(new Set(newItems));
          }}
        />
      ) : (
        isOpen && (
          <SearchDialog
            extraFilters={[
              {
                field: 'id',
                operation: 'notIn',
                values: [resource.id.toString()],
              },
            ]}
            forceCollection={undefined}
            model={resource.specifyModel}
            multiple
            onClose={handleClose}
            onSelected={(resources): void =>
              setIds(new Set([resource.id, ...resources.map(({ id }) => id)]))
            }
          />
        )
      )}
    </>
  );
}
