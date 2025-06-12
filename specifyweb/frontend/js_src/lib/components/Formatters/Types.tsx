import React from 'react';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import type { GetOrSet, RA } from '../../utils/types';
import { Tabs } from '../AppResources/Tabs';
import { NotFoundView } from '../Router/NotFoundView';
import { SafeOutlet } from '../Router/RouterUtils';
import { useRoutePart } from '../Router/useRoutePart';
import type { SpecToJson } from '../Syncer';
import { updateXml } from '../Syncer/xmlToString';
import { FormattersContext } from './index';
import type { Aggregator, Formatter, formattersSpec } from './spec';

const types = ['formatter', 'aggregator'] as const;

export type FormatterTypesOutlet = {
  readonly items: GetOrSet<RA<Aggregator | Formatter>>;
  readonly parsed: SpecToJson<ReturnType<typeof formattersSpec>>;
};

export function FormatterTypes(): JSX.Element {
  const {
    parsed: [parsed, setParsed],
    syncer: { deserializer },
    onChange: handleChange,
  } = React.useContext(FormattersContext)!;

  const [type, setType] = useRoutePart<(typeof types)[number]>('type');
  const indexType = types.indexOf(type as (typeof types)[number]);

  const resolvedType = type === 'formatter' ? 'formatters' : 'aggregators';

  const items = parsed[resolvedType];

  const child = (
    <SafeOutlet<FormatterTypesOutlet>
      items={[
        items,
        (value): void => {
          const newData = { ...parsed, [resolvedType]: value };
          setParsed(newData);
          handleChange(() => updateXml(deserializer(newData)));
        },
      ]}
      parsed={parsed}
    />
  );
  return indexType === -1 ? (
    <NotFoundView container={false} />
  ) : (
    <Tabs
      index={[indexType, (index): void => setType(types[index])]}
      tabs={{
        [commonText.countLine({
          resource: schemaText.tableFormat(),
          count: parsed.formatters.length,
        })]: child,
        [commonText.countLine({
          resource: schemaText.tableAggregation(),
          count: parsed.aggregators.length,
        })]: child,
      }}
    />
  );
}
