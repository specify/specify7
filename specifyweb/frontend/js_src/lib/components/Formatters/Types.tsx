import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
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
import { FormattersContext } from './index';
import type { Aggregator, Formatter } from './spec';
import { formattersSpec } from './spec';

const syncer = f.store(() => syncers.object(formattersSpec()));
const types = ['formatter', 'aggregator'] as const;

export type FormatterTypesOutlet = {
  readonly items: GetOrSet<RA<Aggregator> | RA<Formatter>>;
};

export function FormatterTypes(): JSX.Element {
  const { element } = React.useContext(FormattersContext)!;

  const [type, setType] = useRoutePart<typeof types[number]>('type');
  const indexType = types.indexOf(type as typeof types[number]);

  const resolvedType = type === 'formatter' ? 'formatters' : 'aggregators';

  /*
   * FIXME: call serializer on save click / tab change / full screen toggle,
   *   BUT only if made any changes.
   *   same for user preferences
   */
  const { serializer, deserializer } = syncer();
  const [hasChanges, setHasChange, setNoChanges] = useBooleanState();
  const [parsed, setParsed] = useTriggerState(
    React.useMemo(() => {
      setNoChanges();
      return serializer(element);
    }, [serializer, element, setNoChanges])
  );
  const items = parsed[resolvedType];

  const child = (
    <SafeOutlet<FormatterTypesOutlet>
      items={[
        items,
        (value): void => {
          setParsed({ ...parsed, [resolvedType]: value });
          setHasChange();
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
