import { act } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { tables } from '../../DataModel/tables';
import { LoadingContext } from '../../Core/Contexts';
import { SaveButton } from '../Save';
import { setSaveBlockers } from '../../DataModel/saveBlockers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';

requireContext();

test('reads blockers published while pending rules settle', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const resource = new tables.CollectionObjectGroup.Resource();
  const form = document.createElement('form');
  const onSaving = jest.fn(() => false as const);
  const save = jest.spyOn(resource, 'save');
  mount(
    <UnloadProtectsContext.Provider value={[]}>
      <SaveButton form={form} resource={resource} onSaving={onSaving} />
    </UnloadProtectsContext.Provider>
  );
  await act(async () => undefined);
  let finish: () => void = () => undefined;
  resource.businessRuleManager!.pendingPromise = new Promise<undefined>(
    (resolve) => {
      finish = () => resolve(undefined);
    }
  );
  act(() => {
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true })
    );
  });
  await act(async () => {
    setSaveBlockers(
      resource,
      resource.specifyTable.strictGetField('name'),
      ['Latest validation failed'],
      'late-rule'
    );
    finish();
  });
  expect(onSaving).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
});

test('waits for rules queued after submission began', async () => {
  const resource = new tables.CollectionObjectGroup.Resource();
  const form = document.createElement('form');
  const onSaving = jest.fn(() => false as const);
  mount(<SaveButton form={form} resource={resource} onSaving={onSaving} />);
  await act(async () => undefined);
  let firstDone: () => void = () => undefined;
  let secondDone: () => void = () => undefined;
  const first = new Promise<undefined>((resolve) => {
    firstDone = () => resolve(undefined);
  });
  resource.businessRuleManager!.pendingPromise = first;
  act(() => {
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true })
    );
  });
  const second = new Promise<undefined>((resolve) => {
    secondDone = () => resolve(undefined);
  });
  resource.businessRuleManager!.pendingPromise = Promise.all([
    first,
    second,
  ]).then(() => undefined);
  await act(async () => firstDone());
  expect(onSaving).not.toHaveBeenCalled();
  await act(async () => secondDone());
  expect(onSaving).toHaveBeenCalledTimes(1);
});

test('Clone button is hidden for CollectionObjectGroup, but Add button is not', async () => {
  const resource = new tables.CollectionObjectGroup.Resource();
  const form = document.createElement('form');

  const { queryByRole } = mount(
    <SaveButton form={form} resource={resource} onAdd={jest.fn()} />
  );
  // Let pending business rule checks resolve before asserting
  await act(async () => undefined);

  expect(
    queryByRole('button', { name: formsText.clone() })
  ).not.toBeInTheDocument();
  expect(queryByRole('button', { name: commonText.add() })).toBeInTheDocument();
});

test('checks for confirmation before saving', async () => {
  const resource = new tables.CollectionObjectGroup.Resource();
  const form = document.createElement('form');
  const handleBeforeSaving = jest
    .fn<Promise<boolean>, []>()
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true);
  const handleSaving = jest.fn(() => false as const);

  mount(
    <LoadingContext.Provider value={(promise) => void promise}>
      <SaveButton
        form={form}
        resource={resource}
        onBeforeSaving={handleBeforeSaving}
        onSaving={handleSaving}
      />
    </LoadingContext.Provider>
  );
  await act(async () => undefined);
  await act(async () => {
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true })
    );
  });

  expect(handleBeforeSaving).toHaveBeenCalledTimes(1);
  expect(handleSaving).not.toHaveBeenCalled();

  await act(async () => {
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true })
    );
  });

  expect(handleBeforeSaving).toHaveBeenCalledTimes(2);
  expect(handleSaving).toHaveBeenCalledTimes(1);
});

test('does not submit again while confirmation is pending', async () => {
  const resource = new tables.CollectionObjectGroup.Resource();
  const form = document.createElement('form');
  let resolveConfirmation: (value: boolean) => void = () => undefined;
  const confirmation = new Promise<boolean>((resolve) => {
    resolveConfirmation = resolve;
  });
  const handleBeforeSaving = jest.fn(() => confirmation);

  mount(
    <LoadingContext.Provider value={(promise) => void promise}>
      <SaveButton
        form={form}
        resource={resource}
        onBeforeSaving={handleBeforeSaving}
      />
    </LoadingContext.Provider>
  );
  await act(async () => undefined);

  act(() => {
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true })
    );
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true })
    );
  });
  await act(async () => undefined);

  expect(handleBeforeSaving).toHaveBeenCalledTimes(1);
  await act(async () => resolveConfirmation(false));
});

test('blocks repeated submissions until a custom save settles', async () => {
  const resource = new tables.CollectionObjectGroup.Resource();
  const form = document.createElement('form');
  let finishSaving: (value: false) => void = () => undefined;
  const pendingSave = new Promise<false>((resolve) => {
    finishSaving = resolve;
  });
  const handleSaving = jest.fn(() => pendingSave);
  const save = jest.spyOn(resource, 'save');
  mount(<SaveButton form={form} resource={resource} onSaving={handleSaving} />);
  await act(async () => undefined);
  const submit = (): void => {
    form.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true })
    );
  };
  await act(async () => submit());
  await act(async () => submit());
  expect(handleSaving).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();

  await act(async () => finishSaving(false));
  await act(async () => submit());
  expect(handleSaving).toHaveBeenCalledTimes(2);
  expect(save).not.toHaveBeenCalled();
});
