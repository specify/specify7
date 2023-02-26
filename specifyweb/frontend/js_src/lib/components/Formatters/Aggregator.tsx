import React from 'react';

import { resourcesText } from '../../localization/resources';
import type { GetSet } from '../../utils/types';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import { hasTablePermission } from '../Permissions/helpers';
import { aggregate } from './aggregate';
import { FormattersPickList, ResourceMapping } from './Components';
import { GenericFormatterPreview } from './Preview';
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
        <fieldset>
          <legend>{resourcesText.sortField()}</legend>
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
        </fieldset>
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

function AggregatorPreview({
  aggregator,
}: {
  readonly aggregator: Aggregator;
}): JSX.Element {
  return (
    <GenericFormatterPreview
      doFormatting={React.useCallback(
        async (resources) =>
          aggregate(resources, aggregator).then((aggregated) => [aggregated]),
        [aggregator]
      )}
      table={aggregator.table}
    />
  );
}
