import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import type { GetSet, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { SearchDialog } from '../SearchDialog';
import { hasTablePermission } from '../Permissions/helpers';
import { aggregate } from './aggregate';
import { FormattersPickList, ResourceMapping } from './Components';
import type { Aggregator } from './spec';
import { useAsyncState } from '../../hooks/useAsyncState';
import { fetchCollection } from '../DataModel/collection';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { deserializeResource } from '../DataModel/serializers';
import { ReadOnlyContext } from '../Core/Contexts';

export function AggregatorElement({
  item: [aggregator, setAggregator],
}: {
  readonly item: GetSet<Aggregator>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [openIndex, setOpenIndex] = React.useState<number | undefined>(
    undefined
  );
  return (
    <>
      <Label.Block>
        {resourcesText.separator()}
        <Input.Text
          isReadOnly={isReadOnly}
          value={aggregator.separator}
          onValueChange={(separator): void =>
            setAggregator({
              ...aggregator,
              separator,
            })
          }
        />
      </Label.Block>
      <Label.Block>
        {resourcesText.suffix()}
        <Input.Text
          isReadOnly={isReadOnly}
          value={aggregator.suffix}
          onValueChange={(suffix): void =>
            setAggregator({
              ...aggregator,
              suffix,
            })
          }
        />
      </Label.Block>
      {typeof aggregator.table === 'object' && (
        <Label.Block>
          {resourcesText.sortField()}
          <ResourceMapping
            isReadOnly={isReadOnly}
            mapping={[
              aggregator.sortField,
              (sortField): void =>
                setAggregator({
                  ...aggregator,
                  sortField,
                }),
            ]}
            openIndex={[openIndex, setOpenIndex]}
            table={aggregator.table}
          />
        </Label.Block>
      )}
      <Label.Block>
        {resourcesText.formatter()}
        <FormattersPickList
          table={aggregator.table}
          type="formatters"
          value={aggregator.formatter}
          onChange={(formatter): void =>
            setAggregator({
              ...aggregator,
              formatter,
            })
          }
        />
      </Label.Block>
      <Label.Block>
        {resourcesText.limit()}
        <Input.Number
          isReadOnly={isReadOnly}
          min={0}
          step={1}
          value={aggregator.limit ?? 0}
          onValueChange={(limit): void =>
            setAggregator({
              ...aggregator,
              limit,
            })
          }
        />
      </Label.Block>
      {typeof aggregator.table === 'object' &&
      hasTablePermission(aggregator.table.name, 'read') ? (
        <AggregatorPreview aggregator={aggregator} />
      ) : undefined}
    </>
  );
}

/*
 * FIXME: enforce no mappings to dependent fields (in sortField and
 *   formatter.conditionField
 *   mappings: ['fields', 'toOneIndependent', 'toManyIndependent'],
 */
const defaultPreviewSize = 4;

function AggregatorPreview({
  aggregator,
}: {
  readonly aggregator: Aggregator;
}): JSX.Element {
  const [resources, setResources] = useAsyncState<
    RA<SpecifyResource<AnySchema>>
  >(
    // Use last 10 records as a preview by default
    React.useCallback(
      async () =>
        aggregator.table === undefined
          ? undefined
          : fetchCollection(aggregator.table.name, {
              limit: defaultPreviewSize,
              orderBy: '-id',
            }).then(({ records }) => records.map(deserializeResource)),
      []
    ),
    false
  );
  const [aggregated] = useAsyncState(
    React.useCallback(
      async () =>
        resources === undefined ? false : aggregate(resources, aggregator),
      [resources, aggregator]
    ),
    false
  );

  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const templateResource = React.useMemo(
    () => new aggregator.table!.Resource(),
    [aggregator.table]
  );

  return (
    <div
      // Setting width prevents dialog resizing when output is loaded
      className="flex w-[min(40rem,50vw)] flex-col gap-2"
    >
      {resourcesText.preview()}
      <div>
        <Button.Green onClick={handleOpen}>{commonText.search()}</Button.Green>
      </div>
      {typeof aggregated === 'string' ? (
        <div className="rounded bg-[color:var(--form-background)] p-2">
          <output>{aggregated}</output>
        </div>
      ) : aggregated === undefined ? (
        <p>{commonText.loading()}</p>
      ) : undefined}
      {isOpen && (
        <SearchDialog
          extraFilters={undefined}
          forceCollection={undefined}
          multiple
          templateResource={templateResource}
          onClose={handleClose}
          onSelected={setResources}
        />
      )}
    </div>
  );
}
