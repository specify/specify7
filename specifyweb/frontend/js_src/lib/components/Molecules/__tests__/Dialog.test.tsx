import React from 'react';

import { commonText } from '../../../localization/common';
import { mount } from '../../../tests/reactUtils';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { Dialog } from '../Dialog';

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
