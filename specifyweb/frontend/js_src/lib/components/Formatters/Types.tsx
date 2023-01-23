import React from 'react';

import { useErrorContext } from '../../hooks/useErrorContext';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetOrSet, RA } from '../../utils/types';
import { Tabs } from '../AppResources/Tabs';
import { NotFoundView } from '../Router/NotFoundView';
import { SafeOutlet } from '../Router/RouterUtils';
import { useRoutePart } from '../Router/useRoutePart';
import type { SpecToJson } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { toSimpleXmlNode, updateXml } from '../Syncer/xmlToJson';
import { FormattersContext } from './formatters';
import type { Aggregator, Formatter } from './spec';
import { formattersSpec } from './spec';

const syncer = f.store(() => syncers.object(formattersSpec()));
const types = ['formatter', 'aggregator'] as const;

export type FormatterTypesOutlet = {
  readonly items: GetOrSet<RA<Aggregator | Formatter>>;
  readonly parsed: SpecToJson<ReturnType<typeof formattersSpec>>;
};

export function FormatterTypes(): JSX.Element {
  const { xmlNode, onChange: handleChange } =
    React.useContext(FormattersContext)!;

  const [type, setType] = useRoutePart<typeof types[number]>('type');
  const indexType = types.indexOf(type as typeof types[number]);

  const resolvedType = type === 'formatter' ? 'formatters' : 'aggregators';

  const { serializer, deserializer } = syncer();
  const [parsed, setParsed] = useTriggerState(
    React.useMemo(
      () => serializer(toSimpleXmlNode(xmlNode)),
      [serializer, xmlNode]
    )
  );
  const items = parsed[resolvedType];
  useErrorContext('initialFormattersXml', xmlNode);
  useErrorContext('formatters', parsed);

  const child = (
    <SafeOutlet<FormatterTypesOutlet>
      items={[
        items,
        (value): void => {
          const newData = { ...parsed, [resolvedType]: value };
          setParsed(newData);
          handleChange(() => updateXml(xmlNode, deserializer(newData)));
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
