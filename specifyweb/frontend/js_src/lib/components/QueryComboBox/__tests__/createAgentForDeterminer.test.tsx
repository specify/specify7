import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { localized } from '../../../utils/types';
import { requireContext } from '../../../tests/helpers';
import { LoadingContext } from '../../Core/Contexts';
import type { AnySchema } from '../../DataModel/helperTypes';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { tables } from '../../DataModel/tables';
import { QueryComboBox } from '../index';
import type { TypeSearch } from '../spec';
import { runQuery } from '../../QueryBuilder/ResultsWrapper';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import type { useViewDefinition } from '../../Forms/useViewDefinition';

// The installed MemoryRouter types omit future flags supported by the runtime.
const MemoryRouterWithFuture = MemoryRouter as unknown as React.ComponentType<
  React.ComponentProps<typeof MemoryRouter> & {
    readonly future: {
      readonly v7_startTransition: boolean;
      readonly v7_relativeSplatPath: boolean;
    };
  }
>;

jest.mock('../../QueryBuilder/ResultsWrapper', () => ({ runQuery: jest.fn() }));

jest.mock('../../Forms/Save', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  const SaveButton = ({
    resource,
    onSaved,
  }: {
    readonly resource: {
      readonly get: (fieldName: string) => unknown;
      readonly save: () => Promise<unknown>;
    };
    readonly onSaved?: () => void;
  }) => {
    jest.spyOn(resource, 'save').mockResolvedValue(resource);
    return mockReact.createElement(
      'button',
      {
        type: 'button',
        onClick: async () => {
          await resource.save();
          onSaved?.();
        },
      },
      `Save ${String(resource.get('lastName') ?? 'Agent')}`
    );
  };
  return { SaveButton };
});

jest.mock('../../Forms/useViewDefinition', () => {
  const mockActual = jest.requireActual('../../Forms/useViewDefinition');
  const mockAutoGenerateViewDefinition = jest.requireActual<
    typeof import('../../Forms/generateFormDefinition')
  >('../../Forms/generateFormDefinition').autoGenerateViewDefinition;
  return {
    ...mockActual,
    useViewDefinition: ({ table, formType, mode }: Parameters<typeof useViewDefinition>[0]) => {
      if (table === undefined) return undefined;
      const fieldsToShow =
        table.name === 'Agent'
          ? ['lastName', 'agentType', 'remarks']
          : undefined;
      return mockAutoGenerateViewDefinition(
        table,
        formType,
        mode,
        fieldsToShow as never
      );
    },
  };
});

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasTablePermission: () => true,
}));

jest.mock('../useCollectionRelationships', () => ({
  useCollectionRelationships: () => false,
}));

jest.mock('../useTreeData', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  return {
    TreeDefinitionContext: mockReact.createContext(undefined),
    useTreeData: () => false,
  };
});

jest.mock('../useTypeSearch', () => ({
  useTypeSearch: (typeSearch: TypeSearch) => typeSearch,
}));

requireContext();

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
afterAll(() => portalRoot.remove());

const mockedRunQuery = jest.mocked(runQuery);

test('creates an Agent with type and remarks for a Determiner', async () => {
  mockedRunQuery.mockResolvedValue([]);
  const typeSearch: TypeSearch = {
    name: localized('Agent'),
    table: tables.Agent,
    title: localized('Agent'),
    formatter: localized(''),
    format: localized('%s'),
    displayFields: undefined,
    searchFields: [[tables.Agent.strictGetLiteralField('lastName')]],
  };
  const determiner = new tables.Determiner.Resource(
    {},
    { noBusinessRules: true }
  );
  const setAgent = jest.spyOn(determiner, 'set');

  const user = userEvent.setup();
  render(
    <MemoryRouterWithFuture
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <UnloadProtectsContext.Provider value={[]}>
        <LoadingContext.Provider value={(promise) => void promise}>
          <QueryComboBox
            id="determiner-agent"
            resource={determiner as SpecifyResource<AnySchema>}
            field={tables.Determiner.strictGetRelationship('agent')}
            formType="form"
            isRequired={false}
            hasNewButton
            hasEditButton={false}
            typeSearch={typeSearch}
            forceCollection={undefined}
          />
        </LoadingContext.Provider>
      </UnloadProtectsContext.Provider>
    </MemoryRouterWithFuture>
  );

  const input = screen.getByRole('combobox', { name: 'Agent' });
  await waitFor(() => expect(input).toBeEnabled());
  await act(async () => user.type(input, 'New Agent'));
  await act(async () => user.click(screen.getByRole('button', { name: 'Add' })));

  const agentType = tables.Agent.strictGetLiteralField('agentType');
  await screen.findByRole('textbox', { name: 'Last Name' });
  const remarksInput = screen.getByRole('textbox', { name: 'Remarks' });

  await act(async () => {
    fireEvent.change(remarksInput, {
      target: { value: 'Created from the Determiner form' },
    });
  });
  expect(remarksInput).toHaveValue('Created from the Determiner form');

  const agentTypeInput = screen.getByRole('combobox', {
    name: String(agentType.label),
  });
  await act(async () => user.selectOptions(agentTypeInput, '1'));
  await act(async () =>
    user.click(screen.getByRole('button', { name: 'Save New Agent' }))
  );

  expect(setAgent).toHaveBeenCalledWith(
    'agent',
    expect.objectContaining({ specifyTable: tables.Agent })
  );
  const agentAssignment = setAgent.mock.calls.find(
    ([fieldName, value]) =>
      fieldName === 'agent' &&
      typeof value === 'object' &&
      value !== null &&
      'specifyTable' in value
  );
  const assignedAgent = agentAssignment?.[1] as SpecifyResource<AnySchema>;
  expect(assignedAgent.specifyTable).toBe(tables.Agent);
  expect(assignedAgent.save).toHaveBeenCalledTimes(1);
  expect(assignedAgent.get('lastName')).toBe('New Agent');
  expect(assignedAgent.get('agentType')).toBe(1);
  expect(assignedAgent.get('remarks')).toBe('Created from the Determiner form');
});