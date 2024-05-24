import React from 'react';

import { commonText } from '../../../localization/common';
import { mount, snapshot } from '../../../tests/reactUtils';
import { f } from '../../../utils/functools';
import { Button, DialogContext } from '../Button';
import { className } from '../className';

test('DialogButton closes the dialog', async () => {
  const handleClose = jest.fn();
  const { asFragment, getByRole, user } = mount(
    <DialogContext.Provider value={handleClose}>
      <Button.DialogClose>{commonText.view()}</Button.DialogClose>
    </DialogContext.Provider>
  );

  const button = getByRole('button');
  expect(handleClose).toHaveBeenCalledTimes(0);
  await user.click(button);
  expect(handleClose).toHaveBeenCalledTimes(1);

  expect(asFragment()).toMatchSnapshot();
});

snapshot(Button.LikeLink, { onClick: f.never });
describe('Button.Small', () => {
  snapshot(Button.Small, { onClick: f.never }, 'default variant');
  snapshot(
    Button.Small,
    {
      onClick: f.never,
      variant: className.infoButton,
      className: 'a',
    },
    'custom variant'
  );
});
snapshot(Button.Fancy, { onClick: f.never });
snapshot(Button.Secondary, { onClick: f.never });
snapshot(Button.BorderedGray, { onClick: f.never });
snapshot(Button.Danger, { onClick: f.never });
snapshot(Button.Info, { onClick: f.never });
snapshot(Button.Warning, { onClick: f.never });
snapshot(Button.Success, { onClick: f.never });
snapshot(Button.Icon, { onClick: f.never, title: 'Title', icon: 'cog' });
