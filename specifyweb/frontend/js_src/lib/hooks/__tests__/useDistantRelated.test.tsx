import { act, renderHook, waitFor } from '@testing-library/react';

import type {
  AnySchema,
  SerializedResource,
} from '../../components/DataModel/helperTypes';
import { getResourceApiUrl } from '../../components/DataModel/resource';
import type {
  LiteralField,
  Relationship,
} from '../../components/DataModel/specifyField';
import { tables } from '../../components/DataModel/tables';
import { overrideAjax } from '../../tests/ajax';
import { requireContext } from '../../tests/helpers';
import type { RA } from '../../utils/types';
import { useDistantRelated } from '../resource';

requireContext();

describe('useDistantRelated', () => {
  /*
   *  There are tests already for fetchDistantRelated.
   * Some of the below is taken from tests for fetchDistantRelated.
   */

  const collectorId = 1;
  const secondCollectorId = 2;

  const firstAgentId = 2;
  const secondAgentId = 3;

  const firstAgent = {
    resource_uri: getResourceApiUrl('Agent', firstAgentId),
    id: firstAgentId,
    lastname: 'a',
  };

  const secondAgent = {
    resource_uri: getResourceApiUrl('Agent', secondAgentId),
    id: secondAgentId,
    lastname: 'b',
  };

  const validateCollector = (
    result: ReturnType<typeof useDistantRelated>,
    fields: RA<LiteralField | Relationship> | undefined,
    agent: Partial<SerializedResource<AnySchema>> | undefined
  ) => {
    expect(result).toBeDefined();
    expect(result?.field).toBe(fields?.at(-1));
    if (agent !== undefined) expect(result?.resource?.toJSON()).toEqual(agent);
  };

  overrideAjax(`/api/specify/collector/${collectorId}/`, {
    resource_uri: getResourceApiUrl('Collector', collectorId),
    id: collectorId,
    agent: getResourceApiUrl('Agent', firstAgentId),
  });

  overrideAjax(`/api/specify/collector/${secondCollectorId}/`, {
    resource_uri: getResourceApiUrl('Collector', secondCollectorId),
    id: secondCollectorId,
  });

  overrideAjax(`/api/specify/agent/${firstAgentId}/`, firstAgent);
  overrideAjax(`/api/specify/agent/${secondAgentId}/`, secondAgent);

  test('empty path, that gets set', async () => {
    const resource = new tables.Collector.Resource({ id: collectorId });

    let fields: RA<LiteralField | Relationship> = [];

    const { result, rerender } = renderHook(() =>
      useDistantRelated(resource, fields)
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        resource,
        field: undefined,
      });
    });

    fields = [
      tables.Collector.strictGetField('agent'),
      tables.Agent.strictGetField('lastName'),
    ];

    await act(rerender);

    await waitFor(() => {
      validateCollector(result.current, fields, firstAgent);
    });
  });

  test('undefined path, that gets set', async () => {
    const resource = new tables.Collector.Resource({ id: collectorId });

    let fields: Parameters<typeof useDistantRelated>[1] = undefined;

    const { result, rerender } = renderHook(() =>
      useDistantRelated(resource, fields)
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        resource,
        field: undefined,
      });
    });

    fields = [
      tables.Collector.strictGetField('agent'),
      tables.Agent.strictGetField('lastName'),
    ];

    await act(rerender);

    await waitFor(() => {
      validateCollector(result.current, fields, firstAgent);
    });
  });

  test('multiple field path, and change events', async () => {
    const resource = new tables.Collector.Resource({ id: collectorId });
    const fields = [
      tables.Collector.strictGetField('agent'),
      tables.Agent.strictGetField('lastName'),
    ];

    const { result } = renderHook(() => useDistantRelated(resource, fields));

    await waitFor(() => {
      validateCollector(result.current, fields, firstAgent);
    });

    await act(() => {
      resource.set('agent', secondAgent.resource_uri as never);
    });

    await waitFor(() => {
      validateCollector(result.current, fields, secondAgent);
    });
  });
});
