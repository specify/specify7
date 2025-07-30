import { render, waitFor } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import type { SerializedResource } from '../../DataModel/helperTypes';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import type { SpAppResource, SpViewSetObj } from '../../DataModel/types';
import { exportsForTests } from '../EditorWrapper';
import type { AppResourceMode } from '../helpers';
import type { AppResources } from '../hooks';
import { staticAppResources } from './staticAppResources';
import { TestComponentWrapperRouter } from '../../../tests/utils';

requireContext();

const { useAppResource } = exportsForTests;

function TestComponent({
  newResource,
  resources,
  mode,
  onResultSet: handleResultSet,
}: {
  readonly newResource: SerializedResource<SpAppResource | SpViewSetObj>;
  readonly resources: AppResources;
  readonly mode: AppResourceMode;
  readonly onResultSet: (
    value: SerializedResource<SpAppResource | SpViewSetObj>
  ) => void;
}): JSX.Element {
  const result = useAppResource(newResource, resources, mode);
  React.useEffect(() => {
    handleResultSet(result);
  }, [result]);
  return <></>;
}

describe('useAppResource', () => {
  test('appResource mode (existing resorurce)', async () => {
    const spAppResource = new tables.SpAppResource.Resource({
      name: 'Brand New Resource',
    });
    const serializedNewResource = serializeResource(spAppResource);

    const onResultSet = jest.fn();
    const appResourceToUse = staticAppResources.appResources[0];

    render(
      <TestComponentWrapperRouter
        initialEntries={[`/${appResourceToUse.id}`]}
        path=':id'>
        <TestComponent
          mode="appResources"
          newResource={serializedNewResource}
          resources={staticAppResources as unknown as AppResources}
          onResultSet={onResultSet}
        />
      </TestComponentWrapperRouter>
    );

    await waitFor(() => {
      expect(onResultSet).toHaveBeenCalledTimes(1);
      expect(onResultSet).toHaveBeenCalledWith(appResourceToUse);
    });
  });

  test('appResource mode (new resorurce)', async () => {
    const spAppResource = new tables.SpAppResource.Resource({
      name: 'Brand New Resource',
    });
    const serializedNewResource = serializeResource(spAppResource);

    const onResultSet = jest.fn();

    render(
      <TestComponentWrapperRouter
        initialEntries={[`/2048`]}
        path=':id'>
        <TestComponent
          mode="appResources"
          newResource={serializedNewResource}
          resources={staticAppResources as unknown as AppResources}
          onResultSet={onResultSet}
        />
      </TestComponentWrapperRouter>
    );

    await waitFor(() => {
      expect(onResultSet).toHaveBeenCalledTimes(1);
      expect(onResultSet).toHaveBeenCalledWith(serializedNewResource);
    });
  });

  test('viewSets mode (existing resorurce)', async () => {
    const spViewSetResource = new tables.SpViewSetObj.Resource({
      name: 'Brand New ViewSet Resource',
    });
    const serializedNewResource = serializeResource(spViewSetResource);

    const onResultSet = jest.fn();
    const viewSetToUse = staticAppResources.viewSets[0];

    render(
      <TestComponentWrapperRouter
        initialEntries={[`/${viewSetToUse.id}`]}
        path=':id'>
        <TestComponent
          mode="viewSets"
          newResource={serializedNewResource}
          resources={staticAppResources as unknown as AppResources}
          onResultSet={onResultSet}
        />
      </TestComponentWrapperRouter>
    );

    await waitFor(() => {
      expect(onResultSet).toHaveBeenCalledTimes(1);
      expect(onResultSet).toHaveBeenCalledWith(viewSetToUse);
    });
  });

  test('viewSets mode (new resorurce)', async () => {
    const spViewSetResource = new tables.SpViewSetObj.Resource({
      name: 'Brand New ViewSet Resource',
    });
    const serializedNewResource = serializeResource(spViewSetResource);

    const onResultSet = jest.fn();

    render(
      <TestComponentWrapperRouter
        initialEntries={[`/2048`]}
        path=':id'>
        <TestComponent
          mode="viewSets"
          newResource={serializedNewResource}
          resources={staticAppResources as unknown as AppResources}
          onResultSet={onResultSet}
        />
      </TestComponentWrapperRouter>
    );

    await waitFor(() => {
      expect(onResultSet).toHaveBeenCalledTimes(1);
      expect(onResultSet).toHaveBeenCalledWith(serializedNewResource);
    });
  });
});
