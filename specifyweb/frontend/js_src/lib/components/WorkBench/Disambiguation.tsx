import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Taxon } from '../DataModel/types';
import { isTreeModel } from '../InitialContext/treeRanks';
import { Dialog } from '../Molecules/Dialog';
import { FormattedResource } from '../Molecules/FormattedResource';
import { hasTablePermission } from '../Permissions/helpers';

export function DisambiguationDialog({
  matches,
  onSelected: handleSelected,
  onSelectedAll: handleSelectedAll,
  onClose: handleClose,
}: {
  readonly matches: RA<SpecifyResource<AnySchema>>;
  readonly onSelected: (resource: SpecifyResource<AnySchema>) => void;
  readonly onSelectedAll: (resource: SpecifyResource<AnySchema>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [selected, setSelected] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Blue
            disabled={selected === undefined}
            onClick={(): void => {
              handleSelected(selected!);
              handleClose();
            }}
          >
            {commonText.apply()}
          </Button.Blue>
          <Button.Blue
            disabled={selected === undefined}
            onClick={(): void => {
              handleSelectedAll(selected!);
              handleClose();
            }}
          >
            {commonText.applyAll()}
          </Button.Blue>
        </>
      }
      header={wbText.disambiguateMatches()}
      onClose={handleClose}
    >
      {matches.map((resource) => (
        <Row
          key={resource.cid}
          resource={resource}
          selected={resource === selected}
          onSelected={(): void => setSelected(resource)}
        />
      ))}
    </Dialog>
  );
}

function Row({
  resource,
  selected,
  onSelected: handleSelected,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly selected: boolean;
  readonly onSelected: () => void;
}): JSX.Element {
  const [fullName] = useAsyncState<string | false>(
    React.useCallback(
      () =>
        isTreeModel(resource.specifyModel.name) &&
        hasTablePermission(resource.specifyModel.name, 'read')
          ? (resource as SpecifyResource<Taxon>)
              .rgetPromise('parent')
              .then((parent) =>
                wbText.ambiguousTaxaChild({
                  node: resource.get('fullname'),
                  parent: parent.get('fullName'),
                })
              )
          : false,
      [resource]
    ),
    false
  );
  return (
    <Label.Inline>
      <Input.Radio
        checked={selected}
        name="disambiguate"
        value={resource.id}
        onClick={handleSelected}
      />
      {fullName === false ? (
        <FormattedResource resource={resource} />
      ) : typeof fullName === 'string' ? (
        fullName
      ) : (
        commonText.loading()
      )}
    </Label.Inline>
  );
}
