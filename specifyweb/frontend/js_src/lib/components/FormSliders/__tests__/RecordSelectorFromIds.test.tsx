import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { localized } from '../../../utils/types';
import { requireContext } from '../../../tests/helpers';
import { ReadOnlyContext } from '../../Core/Contexts';
import { tables } from '../../DataModel/tables';
import { SetUnloadProtectsContext } from '../../Router/UnloadProtect';
import { RecordSelectorFromIds } from '../RecordSelectorFromIds';

jest.mock('../../Forms/ResourceView', () => ({
  ResourceView: ({
    headerButtons,
  }: {
    readonly headerButtons: (
      specifyNetworkBadge: JSX.Element,
      showParentResource: JSX.Element
    ) => JSX.Element;
  }) => <>{headerButtons(<span />, <span />)}</>,
}));

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasTablePermission: () => true,
}));

requireContext();

// [FormSliders] Show attachment gallery button in form browser
test('shows the attachment gallery for collection objects', async () => {
  await act(async () => {
    render(
      <ReadOnlyContext.Provider value={false}>
        <SetUnloadProtectsContext.Provider value={jest.fn()}>
          <RecordSelectorFromIds
            dialog={false}
            ids={[101]}
            isDependent={false}
            newResource={undefined}
            table={tables.CollectionObject}
            title={localized('Collection Object')}
            onAdd={undefined}
            onClone={undefined}
            onClose={jest.fn()}
            onDelete={undefined}
            onSaved={jest.fn()}
            onSlide={undefined}
          />
        </SetUnloadProtectsContext.Provider>
      </ReadOnlyContext.Provider>
    );
  });

  expect(
    screen.getByRole('button', { name: 'attachments' })
  ).toBeInTheDocument();
});
