import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { commonText } from '../../../localization/common';
import { schemaText } from '../../../localization/schema';
import * as ajax from '../../../utils/ajax';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { LoadingContext } from '../../Core/Contexts';
import { schema } from '../../DataModel/schema';
import { tables } from '../../DataModel/tables';
import {
  getUniquenessRules,
  useTableUniquenessRules,
} from '../../DataModel/uniquenessRules';
import type { UniquenessRules } from '../../DataModel/uniquenessRules';
import { userInformation } from '../../InitialContext/userInformation';
import {
  SetUnloadProtectsContext,
  UnloadProtectsContext,
} from '../../Router/UnloadProtect';
import { TableUniquenessRules } from '../TableUniquenessRules';

requireContext();

overrideAjax(
  '/businessrules/uniqueness_rules/validate/',
  { totalDuplicates: 0, fields: [] },
  { method: 'POST' }
);

const saved = jest.fn(() => ({}));
overrideAjax('/businessrules/uniqueness_rules/3/', saved, { method: 'PUT' });

let initialRules: UniquenessRules['CollectionObject'];
beforeEach(() => {
  initialRules = getUniquenessRules('CollectionObject');
});
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: jest.fn(),
  });
});
afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});
afterEach(() => {
  const hook = renderHook(() => useTableUniquenessRules('CollectionObject'));
  hook.result.current[2](initialRules);
  hook.unmount();
  jest.restoreAllMocks();
});

function renderConfiguration() {
  return render(
    <MemoryRouter useTransitions={true} initialEntries={['/CollectionObject']}>
      <UnloadProtectsContext.Provider value={[]}>
        <SetUnloadProtectsContext.Provider value={jest.fn()}>
          <LoadingContext.Provider
            value={(promise) => {
              void promise;
            }}
          >
            <Routes>
              <Route path="/:tableName" element={<TableUniquenessRules />} />
            </Routes>
          </LoadingContext.Provider>
        </SetUnloadProtectsContext.Provider>
      </UnloadProtectsContext.Provider>
    </MemoryRouter>
  );
}

test('adds a rule through the configuration interface and saves its configuration', async () => {
  const initial = getUniquenessRules('CollectionObject') ?? [];
  const request = jest.spyOn(ajax, 'ajax');
  const result = renderConfiguration();
  fireEvent.click(
    screen.getByRole('button', { name: schemaText.addUniquenessRule() })
  );
  const save = screen.getByRole('button', { name: commonText.save() });
  await waitFor(() => expect(save).toBeEnabled());
  fireEvent.click(save);
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(save).toBeDisabled());
  const current = getUniquenessRules('CollectionObject')!;
  expect(current).toHaveLength(initial.length + 1);
  expect(current.at(-1)!.rule).toEqual({
    id: null,
    modelName: 'CollectionObject',
    fields: [
      tables.CollectionObject.literalFields.filter(
        (field) => !field.isVirtual
      )[0].name,
    ],
    scopes: [],
    isDatabaseConstraint: false,
  });
  expect(request).toHaveBeenCalledWith(
    `/businessrules/uniqueness_rules/${schema.domainLevelIds.discipline}/`,
    expect.objectContaining({
      method: 'PUT',
      body: {
        model: 'CollectionObject',
        rules: current.map(({ rule }) => rule),
      },
    })
  );
  result.unmount();
});

test('non-admin users cannot add, edit, or save uniqueness rules', () => {
  const original = userInformation.isadmin;
  Object.assign(userInformation, { isadmin: false });
  try {
    renderConfiguration();
    expect(
      screen.getByRole('button', { name: schemaText.addUniquenessRule() })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: commonText.save() })
    ).toBeDisabled();
    expect(document.querySelector('button[aria-selected]')).toBeNull();
    expect(saved).not.toHaveBeenCalled();
  } finally {
    Object.assign(userInformation, { isadmin: original });
  }
});

test('edits and saves the existing Catalog Number scope while preserving its rule id', async () => {
  const request = jest.spyOn(ajax, 'ajax');
  const existing = getUniquenessRules('CollectionObject')!.find(({ rule }) =>
    rule.fields.includes('catalogNumber')
  )!.rule;
  renderConfiguration();
  fireEvent.click(document.querySelector('button[aria-selected]')!);
  const editor = within(
    screen.getByRole('dialog', { name: schemaText.configureUniquenessRule() })
  );
  fireEvent.click(
    editor.getByText(schemaText.database(), { selector: 'span' })
  );
  fireEvent.click(editor.getByRole('button', { name: schemaText.setScope() }));
  await waitFor(() =>
    expect(
      editor
        .getAllByRole('textbox')
        .some(
          (input) => (input as HTMLInputElement).value === schemaText.database()
        )
    ).toBe(true)
  );
  fireEvent.click(editor.getByRole('button', { name: commonText.close() }));
  fireEvent.click(screen.getByRole('button', { name: commonText.save() }));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith(
      `/businessrules/uniqueness_rules/${schema.domainLevelIds.discipline}/`,
      expect.objectContaining({
        method: 'PUT',
        body: {
          model: 'CollectionObject',
          rules: expect.arrayContaining([{ ...existing, scopes: [] }]),
        },
      })
    )
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: commonText.save() })
    ).toBeDisabled()
  );
});

test('configures and saves a new grouped rule with a boolean field and collection scope', async () => {
  const request = jest.spyOn(ajax, 'ajax');
  renderConfiguration();
  const initialEditable = document.querySelectorAll(
    'button[aria-selected]'
  ).length;
  fireEvent.click(
    screen.getByRole('button', { name: schemaText.addUniquenessRule() })
  );
  await waitFor(() =>
    expect(document.querySelectorAll('button[aria-selected]')).toHaveLength(
      initialEditable + 1
    )
  );
  fireEvent.click(
    Array.from(document.querySelectorAll('button[aria-selected]')).at(-1)!
  );
  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: 'text1' },
  });
  await waitFor(() =>
    expect(screen.getByRole('combobox')).toHaveValue('text1')
  );
  fireEvent.click(screen.getByRole('button', { name: commonText.add() }));
  await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(2));
  fireEvent.change(screen.getAllByRole('combobox')[1], {
    target: { value: 'yesNo1' },
  });
  await waitFor(() =>
    expect(screen.getAllByRole('combobox')[1]).toHaveValue('yesNo1')
  );
  fireEvent.click(
    screen.getByText(
      tables.CollectionObject.getRelationship('collection')!.label,
      { selector: 'span' }
    )
  );
  fireEvent.click(screen.getByRole('button', { name: schemaText.setScope() }));
  await waitFor(() =>
    expect(
      screen
        .getAllByRole('textbox')
        .filter(
          (input) =>
            (input as HTMLInputElement).value ===
            tables.CollectionObject.getRelationship('collection')!.label
        )
    ).toHaveLength(3)
  );
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith(
      '/businessrules/uniqueness_rules/validate/',
      expect.objectContaining({
        body: {
          table: 'CollectionObject',
          rule: { fields: ['text1', 'yesNo1'], scopes: ['collection'] },
        },
      })
    )
  );
  // Close only the rule editor; the outer configuration remains open.
  fireEvent.click(
    screen.getAllByRole('button', { name: commonText.close() }).at(-1)!
  );
  fireEvent.click(screen.getByRole('button', { name: commonText.save() }));
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      `/businessrules/uniqueness_rules/${schema.domainLevelIds.discipline}/`,
      expect.objectContaining({
        method: 'PUT',
        body: {
          model: 'CollectionObject',
          rules: expect.arrayContaining([
            {
              id: null,
              modelName: 'CollectionObject',
              fields: ['text1', 'yesNo1'],
              scopes: ['collection'],
              isDatabaseConstraint: false,
            },
          ]),
        },
      })
    )
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: commonText.save() })
    ).toBeDisabled()
  );
});
