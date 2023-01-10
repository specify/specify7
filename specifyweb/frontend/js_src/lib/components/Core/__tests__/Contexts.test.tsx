import { act, render, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { LeakContext, mount } from '../../../tests/reactUtils';
import { flippedPromise } from '../../../utils/promise';
import { crash } from '../../Errors/Crash';
import {
  Contexts,
  ErrorContext,
  LoadingContext,
  SetUnloadProtectsContext,
  UnloadProtectsContext,
} from '../Contexts';
import { mainText } from '../../../localization/main';

jest.mock('../../Errors/Crash', () => ({
  ...jest.requireActual('../../Errors/Crash'),
  crash: jest.fn(),
}));

test('<Contexts> is providing error context', async () => {
  const handleError = jest.fn(
    (value: React.ContextType<typeof ErrorContext>) => value
  );
  const { findByRole, queryByRole, user } = mount(
    <Contexts>
      <LeakContext context={ErrorContext} onLoaded={handleError} />
    </Contexts>
  );

  const emitError = handleError.mock.calls[0][0]!;
  expect(emitError).toBeInstanceOf(Function);
  act(() =>
    emitError(({ onClose: handleClose }) => (
      <button type="button" onClick={handleClose}>
        {mainText.errorMessage()}
      </button>
    ))
  );
  const button = await findByRole('button');
  await user.click(button);
  // Wait for button to get removed
  if (queryByRole('button') !== null) await waitForElementToBeRemoved(button);
});

test('<Contexts> provide a loading context', async () => {
  const handleLoading = jest.fn(
    (value: React.ContextType<typeof LoadingContext>) => value
  );
  const { findByRole } = render(
    <Contexts>
      <LeakContext context={LoadingContext} onLoaded={handleLoading} />
    </Contexts>
  );

  // Loading
  const loading = handleLoading.mock.calls[0][0]!;
  expect(loading).toBeDefined();
  const promise = flippedPromise();
  const promise2 = flippedPromise();
  act(() => loading(promise));
  act(() => loading(promise2));

  const heading = await findByRole('heading', { name: commonText.loading() });

  promise.resolve();
  promise2.resolve();

  await waitForElementToBeRemoved(heading);

  // Loading can reject a promise
  const rejectedPromise = flippedPromise();
  act(() => loading(rejectedPromise));
  const newHeading = await findByRole('heading', {
    name: commonText.loading(),
  });
  expect(crash).not.toHaveBeenCalled();
  jest.spyOn(console, 'error').mockImplementation();
  rejectedPromise.reject('error');
  await waitForElementToBeRemoved(newHeading);
  expect(crash).toHaveBeenCalledTimes(1);
});

test('<Contexts> is providing UnloadProtectsContext', () => {
  const handleUnloadProtect = jest.fn(
    (value: React.ContextType<typeof UnloadProtectsContext>) => value
  );
  const handleSetUnloadProtect = jest.fn(
    (value: React.ContextType<typeof SetUnloadProtectsContext>) => value
  );
  render(
    <Contexts>
      <LeakContext
        context={UnloadProtectsContext}
        onLoaded={handleUnloadProtect}
      />
      <LeakContext
        context={SetUnloadProtectsContext}
        onLoaded={handleSetUnloadProtect}
      />
    </Contexts>
  );

  // Unload Protects
  const getUnloadProtects = handleUnloadProtect.mock.calls[0][0]!;
  expect(getUnloadProtects).toHaveLength(0);

  const setUnloadProtects = handleSetUnloadProtect.mock.calls[0][0]!;
  expect(setUnloadProtects).toBeInstanceOf(Function);
});
