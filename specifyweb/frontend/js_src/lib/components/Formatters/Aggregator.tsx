import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import type { GetSet, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import { SearchDialog } from '../Forms/SearchDialog';
import { hasTablePermission } from '../Permissions/helpers';
import type { FieldType } from '../WbPlanView/mappingHelpers';
import { aggregate } from './aggregate';
import { FormattersPickList, ResourceMapping } from './Components';
import type { Aggregator } from './spec';

export function AggregatorElement({
  item: [aggregator, setAggregator],
  isReadOnly,
}: {
  readonly item: GetSet<Aggregator>;
  readonly isReadOnly: boolean;
}): JSX.Element {
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
      <Label.Block>
        {resourcesText.limit()}
        <Input.Number
          isReadOnly={isReadOnly}
          min={0}
          step={1}
          value={aggregator.limit}
          onValueChange={(limit): void =>
            setAggregator({
              ...aggregator,
              limit,
            })
          }
        />
      </Label.Block>
      <FormattersPickList
        // REFACTOR: create a readonly context, that would render everything below as readonly
        isReadOnly={isReadOnly}
        value={aggregator.formatter}
        onChange={(formatter): void =>
          setAggregator({
            ...aggregator,
            formatter,
          })
        }
      />
      {/* FIXME: add a preview of an aggregator in action */}
      {typeof aggregator.table === 'object' && (
        <Label.Block>
          {resourcesText.sortField()}
          <ResourceMapping
            allowedMappings={allowedMappings}
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
      {typeof aggregator.table === 'object' &&
      hasTablePermission(aggregator.table.name, 'read') ? (
        <AggregatorPreview aggregator={aggregator} />
      ) : undefined}
    </>
  );
}

const allowedMappings: RA<FieldType> = ['toOneIndependent', 'toOneDependent'];
/*
 * FIXME: enforce no mappings to dependent fields
 *   mappings: ['fields', 'toOneIndependent', 'toManyIndependent'],
 */

function AggregatorPreview({
  aggregator,
}: {
  readonly aggregator: Aggregator;
}): JSX.Element {
  const [aggregated, setAggregated] = React.useState<string | undefined>(
    undefined
  );
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resource = React.useMemo(
    () => new aggregator.table!.Resource(),
    [aggregator.table]
  );
  const loading = React.useContext(LoadingContext);

  return (
    <>
      {resourcesText.preview()}
      <div>
        <Button.Green onClick={handleOpen}>{commonText.search()}</Button.Green>
      </div>
      {typeof aggregated === 'string' && <output>{aggregated}</output>}
      {isOpen && (
        <SearchDialog
          extraFilters={undefined}
          forceCollection={undefined}
          multiple
          templateResource={resource}
          onClose={handleClose}
          onSelected={(resources): void =>
            loading(aggregate(resources, aggregator).then(setAggregated))
          }
        />
      )}
    </>
  );
}
