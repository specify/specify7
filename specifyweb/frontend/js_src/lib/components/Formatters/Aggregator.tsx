import React from 'react';

import { resourcesText } from '../../localization/resources';
import type { GetSet, RA } from '../../utils/types';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { hasTablePermission } from '../Permissions/helpers';
import { aggregate } from './aggregate';
import { FormattersPickList, ResourceMapping } from './Components';
import { ResourcePreview } from './Preview';
import type { Aggregator } from './spec';

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
      <div className="grid grid-cols-2 gap-4">
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
        <Label.Block>
          {resourcesText.limit()}
          <Input.Integer
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
      </div>
      {typeof aggregator.table === 'object' && (
        <fieldset>
          <legend>{resourcesText.sortField()}</legend>
          <ResourceMapping
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
        </fieldset>
      )}
      <AggregatorPreview aggregator={aggregator} />
    </>
  );
}

function AggregatorPreview({
  aggregator,
}: {
  readonly aggregator: Aggregator;
}): JSX.Element | null {
  const doFormatting = React.useCallback(
    async (resources: RA<SpecifyResource<AnySchema>>) =>
      aggregate(resources, aggregator).then((aggregated) => [aggregated]),
    [aggregator]
  );
  return typeof aggregator.table === 'object' &&
    hasTablePermission(aggregator.table.name, 'read') ? (
    <ResourcePreview
      doFormatting={doFormatting}
      isAggregator
      table={aggregator.table}
    />
  ) : null;
}
