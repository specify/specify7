import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { RecordMergingContext } from '../../Core/Contexts';
import { tables } from '../../DataModel/tables';
import { defaultDataViewQuery } from '../../DataViews/queries';
import { FormMeta } from '../../FormMeta';
import { formsText } from '../../../localization/forms';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { parseQueryFields, queryFieldsToFieldSpecs } from '../helpers';
import { QueryResults } from '../Results';

requireContext();

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasPermission: () => true,
  hasTablePermission: () => true,
  hasToolPermission: () => false,
}));
jest.mock('../../Permissions/PermissionDenied', () => ({
  ProtectedTool: () => null,
  ProtectedAction: () => null,
}));
jest.mock('../../Merging', () => ({
  RecordMergingLink: () => <button>Merge selected records</button>,
}));
jest.mock('../ToForms', () => ({ QueryToForms: () => null }));
jest.mock('../ToMap', () => ({ QueryToMap: () => null }));
jest.mock('../ResultsTable', () => ({ QueryResultsTable: () => null }));
jest.mock('../../FormMeta/MergeRecord', () => ({
  MergeRecord: () => <button>Merge this record</button>,
}));
jest.mock('../../FormMeta/AutoNumbering', () => ({
  AutoNumbering: () => null,
}));
jest.mock('../../FormMeta/CarryForward', () => ({
  ...jest.requireActual('../../FormMeta/CarryForward'),
  CarryForwardConfig: () => null,
}));
jest.mock('../../FormMeta/Clone', () => ({
  CloneConfig: () => null,
  AddButtonConfig: () => null,
}));
jest.mock('../../FormMeta/Definition', () => ({ Definition: () => null }));
jest.mock('../../FormMeta/EditHistory', () => ({ EditHistory: () => null }));
jest.mock('../../FormMeta/PickListUsages', () => ({
  PickListUsages: () => null,
}));
jest.mock('../../FormMeta/QueryTreeUsages', () => ({
  QueryTreeUsages: () => null,
}));
jest.mock('../../FormMeta/ReadOnlyMode', () => ({ ReadOnlyMode: () => null }));
jest.mock('../../FormMeta/ShareRecord', () => ({ ShareRecord: () => null }));
jest.mock('../../FormCommands', () => ({ GenerateLabel: () => null }));
jest.mock('../../FormFields/Checkbox', () => ({ PrintOnSave: () => null }));

test('hides merging in Data Views without changing Query Builder availability', async () => {
  const fields = parseQueryFields(defaultDataViewQuery('Agent').fields);
  const fieldSpecs = queryFieldsToFieldSpecs('Agent', fields).map(
    ([, fieldSpec]) => fieldSpec
  );
  const results = (
    <QueryResults
      table={tables.Agent}
      queryResource={undefined}
      fetchSize={40}
      fetchResults={async () => [[1], [2]]}
      fetchCount={undefined}
      totalCount={2}
      fieldSpecs={fieldSpecs}
      displayedFields={fields}
      allFields={fields}
      initialData={[[1], [2]]}
      selectedRows={[new Set([1, 2]), jest.fn()]}
      onReRun={jest.fn()}
      createRecordSet={undefined}
      extraButtons={undefined}
    />
  );
  const { rerender } = render(results);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Merge selected records' })
    ).toBeInTheDocument()
  );

  await act(async () =>
    rerender(
      <RecordMergingContext.Provider value={false}>
        {results}
      </RecordMergingContext.Provider>
    )
  );
  expect(
    screen.queryByRole('button', { name: 'Merge selected records' })
  ).not.toBeInTheDocument();
});

test('hides the preview form merge action when merging is disabled', async () => {
  const formMeta = (
    <FormMeta
      resource={new tables.Agent.Resource({ id: 1 })}
      viewDescription={undefined}
    />
  );
  const { rerender } = render(formMeta, {
    wrapper: ({ children }) => (
      <UnloadProtectsContext.Provider value={[]}>
        {children}
      </UnloadProtectsContext.Provider>
    ),
  });
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: formsText.formMeta() }))
  );
  expect(
    screen.getByRole('button', { name: 'Merge this record' })
  ).toBeInTheDocument();
  await act(async () =>
    rerender(
      <RecordMergingContext.Provider value={false}>
        {formMeta}
      </RecordMergingContext.Provider>
    )
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: formsText.formMeta() }))
  );
  expect(
    screen.queryByRole('button', { name: 'Merge this record' })
  ).not.toBeInTheDocument();
});
