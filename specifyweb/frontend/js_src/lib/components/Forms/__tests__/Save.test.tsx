import { act } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { tables } from '../../DataModel/tables';
import { LoadingContext } from '../../Core/Contexts';
import { SaveButton } from '../Save';

requireContext();

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
