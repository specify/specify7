import React from 'react';

import { commonText } from '../../../localization/common';
import { localized } from '../../../utils/types';
import { mount } from '../../../tests/reactUtils';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { Dialog } from '../Dialog';

test('keeps the background inert until every modal closes, regardless of non-modal dialogs', () => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.append(root);
  const view = (outer: boolean, inner: boolean, nonModal: boolean) => (
    <UnloadProtectsContext.Provider value={[]}>
      {outer && (
        <Dialog
          buttons={undefined}
          header={localized('Outer')}
          onClose={jest.fn()}
        >
          Outer content
        </Dialog>
      )}
      {inner && (
        <Dialog
          buttons={undefined}
          header={localized('Inner')}
          onClose={jest.fn()}
        >
          Inner content
        </Dialog>
      )}
      {nonModal && (
        <Dialog
          modal={false}
          buttons={undefined}
          header={localized('Filters')}
          onClose={jest.fn()}
        >
          Filter content
        </Dialog>
      )}
    </UnloadProtectsContext.Provider>
  );
  const { rerender, unmount } = mount(view(true, false, false));
  expect(root).toHaveAttribute('inert');
  rerender(view(true, true, true));
  expect(root).toHaveAttribute('inert');
  rerender(view(false, true, false));
  expect(root).toHaveAttribute('inert');
  rerender(view(false, false, false));
  expect(root).not.toHaveAttribute('inert');
  unmount();
  root.remove();
});

test('Escape invokes the configured dialog close shortcut', async () => {
  const onClose = jest.fn();
  const { user } = mount(
    <UnloadProtectsContext.Provider value={[]}>
      <Dialog buttons={undefined} header={commonText.close()} onClose={onClose}>
        Dialog content
      </Dialog>
    </UnloadProtectsContext.Provider>
  );

  await user.keyboard('{Escape}');

  expect(onClose).toHaveBeenCalledTimes(1);
});
