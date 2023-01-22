import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetOrSet, RA } from '../../utils/types';
import { Tabs } from '../AppResources/Tabs';
import { NotFoundView } from '../Router/NotFoundView';
import { SafeOutlet } from '../Router/RouterUtils';
import { useRoutePart } from '../Router/useRoutePart';
import { syncers } from '../Syncer/syncers';
import { formatXml } from '../Syncer/xmlUtils';
import { FormattersContext } from './index';
import type { Aggregator, Formatter } from './spec';
import { formattersSpec } from './spec';
import { useErrorContext } from '../../hooks/useErrorContext';

const syncer = f.store(() => syncers.object(formattersSpec()));
const types = ['formatter', 'aggregator'] as const;

export type FormatterTypesOutlet = {
  readonly items: GetOrSet<RA<Aggregator | Formatter>>;
};

export function FormatterTypes(): JSX.Element {
  const { element, onChange: handleChange } =
    React.useContext(FormattersContext)!;

  const [type, setType] = useRoutePart<typeof types[number]>('type');
  const indexType = types.indexOf(type as typeof types[number]);

  const resolvedType = type === 'formatter' ? 'formatters' : 'aggregators';

  const { serializer, deserializer } = syncer();
  const [parsed, setParsed] = useTriggerState(
    React.useMemo(() => serializer(element), [serializer, element])
  );
  const items = parsed[resolvedType];
  useErrorContext('initialFormattersXml', element);
  useErrorContext('formatters', parsed);

  const child = (
    <SafeOutlet<FormatterTypesOutlet>
      items={[
        items,
        (value): void => {
          const newData = { ...parsed, [resolvedType]: value };
          setParsed(newData);
          handleChange(() => {
            deserializer(parsed, element);
            return formatXml(element.outerHTML);
          });
        },
      ]}
    />
  );
  return indexType === -1 ? (
    <NotFoundView container={false} />
  ) : (
    <Tabs
      index={[indexType, (index): void => setType(types[index])]}
      tabs={{
        [commonText.countLine({
          resource: resourcesText.formatters(),
          count: parsed.formatters.length,
        })]: child,
        [commonText.countLine({
          resource: resourcesText.aggregators(),
          count: parsed.aggregators.length,
        })]: child,
      }}
    />
  );
}
