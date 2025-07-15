import { render } from '@testing-library/react';
import React from 'react';

import { LeakContext } from '../../../tests/reactUtils';
import { MenuContext, SetMenuContext } from '../../Header/MenuContext';
import { Contexts } from '../Contexts';

test('<Main> is providing MenuContext', () => {
  const handleMenu = jest.fn(
    (value: React.ContextType<typeof MenuContext>) => value
  );
  const handleSetMenu = jest.fn(
    (value: React.ContextType<typeof SetMenuContext>) => value
  );
  render(
    <Contexts>
      <LeakContext context={MenuContext} onLoaded={handleMenu} />
      <LeakContext context={SetMenuContext} onLoaded={handleSetMenu} />
    </Contexts>
  );

  expect(handleMenu.mock.calls[0][0]!).toBeUndefined();
  expect(handleSetMenu.mock.calls[0][0]!).toBeInstanceOf(Function);
});
