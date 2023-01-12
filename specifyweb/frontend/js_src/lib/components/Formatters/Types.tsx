import { f } from '../../utils/functools';
import { syncers } from '../Syncer/syncers';
import { formattersSpec } from './spec';
import { useTriggerState } from '../../hooks/useTriggerState';
import React from 'react';
import { Tabs } from '../AppResources/Tabs';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { FormattersContext } from './index';
import { useRoutePart } from '../Router/useRoutePart';
import {NotFoundView} from '../Router/NotFoundView';
import {Outlet} from 'react-router';

const syncer = f.store(() => syncers.object(formattersSpec()));
const types = ['formatter','aggregator'];

export function FormatterTypes(): JSX.Element {
  const { element } = React.useContext(FormattersContext)!;

  const [type, setType] = useRoutePart('type');
  const indexType = types.indexOf(type);

  const { serializer, deserializer } = syncer();
  const [parsed, setParsed] = useTriggerState(
    React.useMemo(() => serializer(element), [serializer, element])
  );
  return indexType === -1 ? <NotFoundView /> :(
    <Tabs
      index={[indexType, (index):void=>setType(types[index])]}
      tabs={{
        [commonText.countLine({
          resource: resourcesText.formatters(),
          count: parsed.formatters.length,
        })]: (
          <Outlet />
          <Items
            component={FormatterElement}
            items={[
              parsed.formatters,
              (formatters): void =>
                setParsed({
                  ...parsed,
                  formatters,
                }),
            ]}
            label={resourcesText.formatters()}
          />
        ),
        [commonText.countLine({
          resource: resourcesText.aggregators(),
          count: parsed.aggregators.length,
        })]: (
          <Items
            component={AggregatorElement}
            items={[
              parsed.aggregators,
              (aggregators): void =>
                setParsed({
                  ...parsed,
                  aggregators,
                }),
            ]}
            label={resourcesText.aggregators()}
          />
        ),
      }}
    />
  );
}
