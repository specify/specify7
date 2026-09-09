import { act } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { tables } from '../../DataModel/tables';
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
