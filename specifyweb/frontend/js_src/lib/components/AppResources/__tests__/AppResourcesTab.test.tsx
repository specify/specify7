import React from 'react';

import { clearIdStore } from '../../../hooks/useId';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { f } from '../../../utils/functools';
import { localized } from '../../../utils/types';
import { Button } from '../../Atoms/Button';
import { deserializeResource } from '../../DataModel/serializers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import type { AppResourceTabProps } from '../TabDefinitions';
import { AppResourcesTab } from '../Tabs';
import { testAppResources } from './testAppResources';

beforeEach(() => {
  clearIdStore();
});

requireContext();

function Component(props: AppResourceTabProps) {
  return <h1>Data: {props.data}</h1>;
}

describe('AppResourcesTab', () => {
  test('simple render', () => {
    const { asFragment } = mount(
      <AppResourcesTab
        appResource={deserializeResource(testAppResources.appResources[0])}
        data="TestData"
        directory={testAppResources.directories[0]}
        footer={<h3>TestFooter</h3>}
        headerButtons={<Button.Info onClick={f.void} />}
        isFullScreen={[false, f.void]}
        label={localized('test')}
        resource={testAppResources.appResources[0]}
        tab={Component}
        onChange={f.void}
        onSetCleanup={f.void}
      />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  test('dialog render', () => {
    const { getByRole } = mount(
      <UnloadProtectsContext.Provider value={[]}>
        <AppResourcesTab
          appResource={deserializeResource(testAppResources.appResources[0])}
          data="TestData"
          directory={testAppResources.directories[0]}
          footer={<h3>TestFooter</h3>}
          headerButtons={<Button.Info onClick={f.void} />}
          isFullScreen={[true, f.void]}
          label={localized('test')}
          resource={testAppResources.appResources[0]}
          tab={Component}
          onChange={f.void}
          onSetCleanup={f.void}
        />
      </UnloadProtectsContext.Provider>
    );

    const dialog = getByRole('dialog');
    expect(dialog).toMatchSnapshot();
  });
});
