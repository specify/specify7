import React from 'react';

import type { PickList, SpQuery } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { flippedSortTypes } from '../querybuilderutils';
import { QueryFieldSpec } from '../queryfieldspec';
import { schema } from '../schema';
import { Button } from './basic';
import { useBooleanState } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';
import { QueryBuilder } from './querybuilder';
import { queryFieldFilters } from './querybuilderfieldfilter';
import { createQuery } from './querytask';

export function PickListUsages({
  pickList,
}: {
  readonly pickList: SpecifyResource<PickList>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Small onClick={handleOpen}>
        {formsText('findUsages')}
      </Button.Small>
      {isOpen && (
        <PickListUsagesDialog pickList={pickList} onClose={handleClose} />
      )}
    </>
  );
}

function PickListUsagesDialog({
  pickList,
  onClose: handleClose,
}: {
  readonly pickList: SpecifyResource<PickList>;
  readonly onClose: () => void;
}): JSX.Element {
  const query = usePickListQuery(pickList);
  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText('close')}</Button.DialogClose>}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={pickList.specifyModel.label}
      onClose={handleClose}
    >
      <QueryBuilder
        autoRun
        isEmbedded
        isReadOnly={false}
        query={query}
        recordSet={undefined}
      />
    </Dialog>
  );
}

function usePickListQuery(
  resource: SpecifyResource<PickList>
): SpecifyResource<SpQuery> {
  return React.useMemo(
    () =>
      createQuery(
        formsText('usagesOfPickList', resource.get('name')),
        schema.models.SpLocaleContainerItem
      ).set('fields', [
        QueryFieldSpec.fromPath('SpLocaleContainerItem', ['container', 'name'])
          .toSpQueryField()
          .set('sortType', flippedSortTypes.ascending),
        QueryFieldSpec.fromPath('SpLocaleContainerItem', ['name'])
          .toSpQueryField()
          .set('sortType', flippedSortTypes.ascending),
        QueryFieldSpec.fromPath('SpLocaleContainerItem', ['pickListName'])
          .toSpQueryField()
          .set('isDisplay', false)
          .set('operStart', queryFieldFilters.equal.id)
          .set('startValue', resource.get('name')),
      ]),
    [resource]
  );
}
