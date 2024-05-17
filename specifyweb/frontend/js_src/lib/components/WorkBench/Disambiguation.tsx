import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA, WritableArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Taxon } from '../DataModel/types';
import { isTreeTable } from '../InitialContext/treeRanks';
import { Dialog } from '../Molecules/Dialog';
import { FormattedResource } from '../Molecules/FormattedResource';
import { hasTablePermission } from '../Permissions/helpers';

export function DisambiguationDialog({
  matches,
  liveValidationStack,
  defaultResource,
  onSelected: handleSelected,
  onSelectedAll: handleSelectedAll,
  onClose: handleClose,
}: {
  readonly matches: RA<SpecifyResource<AnySchema>>;
  readonly liveValidationStack?: WritableArray<number>;
  readonly defaultResource?: SpecifyResource<AnySchema>;
  readonly onSelected: (resource: SpecifyResource<AnySchema>) => void;
  readonly onSelectedAll: (resource: SpecifyResource<AnySchema>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [selected, setSelected] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(defaultResource);

  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Info
            disabled={selected === undefined}
            onClick={(): void => {
              handleSelected(selected!);
              handleClose();
            }}
          >
            {commonText.apply()}
          </Button.Info>
          <Button.Info
            disabled={
              selected === undefined || liveValidationStack?.length !== 0
            }
            title={
              liveValidationStack?.length === 0
                ? undefined
                : wbText.applyAllUnavailable()
            }
            onClick={(): void => {
              handleSelectedAll(selected!);
              handleClose();
            }}
          >
            {commonText.applyAll()}
          </Button.Info>
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
      async () =>
        isTreeTable(resource.specifyTable.name) &&
        hasTablePermission(resource.specifyTable.name, 'read')
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
