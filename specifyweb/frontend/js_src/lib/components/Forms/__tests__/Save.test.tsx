import { act } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { tables } from '../../DataModel/tables';
import { userPreferences } from '../../Preferences/userPreferences';
import { SaveButton } from '../Save';

requireContext();

const originalCarryForward = userPreferences.get(
  'form',
  'preferences',
  'enableCarryForward'
);

beforeEach(() => {
  userPreferences.set('form', 'preferences', 'enableCarryForward', [
    'CollectionObjectGroup',
  ]);
});

afterEach(() => {
  userPreferences.set(
    'form',
    'preferences',
    'enableCarryForward',
    originalCarryForward
  );
});

test('Clone and Carry Forward buttons are hidden for CollectionObjectGroup, but Add is not', async () => {
  expect(
    userPreferences.get('form', 'preferences', 'enableCarryForward')
  ).toContain('CollectionObjectGroup');

  const resource = new tables.CollectionObjectGroup.Resource();
  const form = document.createElement('form');

  const { queryByRole } = mount(
    <SaveButton form={form} resource={resource} onAdd={jest.fn()} />
  );
  // Let pending business rule checks resolve before asserting
  await act(async () => undefined);

  expect(
    queryByRole('button', { name: formsText.carryForward() })
  ).not.toBeInTheDocument();
  expect(
    queryByRole('button', { name: formsText.clone() })
  ).not.toBeInTheDocument();
  expect(queryByRole('button', { name: commonText.add() })).toBeInTheDocument();
});
