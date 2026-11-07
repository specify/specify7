import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import * as resourceModule from '../../DataModel/resource';
import { parseQueryFields } from '../../QueryBuilder/helpers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { parseDefinition, QueryMapping, TermPicker } from '../DwcaDefinition';
import { defaultTemplates } from '../data/defaultTemplates';

jest.mock('../../QueryBuilder/Wrapped', () => ({
  QueryBuilder: (): null => null,
}));
let mockSavedQueries:
  | {
      readonly records: readonly {
        readonly id: number;
        readonly name: string;
        readonly contextTableId: number;
      }[];
    }
  | undefined;
jest.mock('../../../hooks/useAsyncState', () => ({
  useAsyncState: (): readonly [typeof mockSavedQueries] => [mockSavedQueries],
}));

requireContext();
beforeEach(() => {
  mockSavedQueries = undefined;
});
afterEach(() => {
  jest.restoreAllMocks();
});

test('highlights displayed fields without a Darwin Core term', () => {
  const [mapping] = parseDefinition(`
    <archive>
      <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
        <queries>
          <query name="occurrence.csv" contextTableId="1">
            <field
              stringId="1.collectionobject.guid"
              isDisplay="true"
              term="http://rs.tdwg.org/dwc/terms/occurrenceID"
            />
            <field stringId="1.collectionobject.text1" isDisplay="true" />
          </query>
        </queries>
      </core>
    </archive>
  `);
  expect(mapping).toBeDefined();
  const field = parseQueryFields(mapping!.fields)[1];
  expect(field).toBeDefined();
  const unmapped = {
    ...mapping!,
    terms: mapping!.terms.map((term, index) =>
      index === field!.sourceIndex ? undefined : term
    ),
  };

  const view = (isDisplay: boolean): JSX.Element => (
    <TermPicker
      field={{ ...field!, isDisplay }}
      fieldIndex={field!.id}
      mapping={unmapped}
      onChange={jest.fn()}
    />
  );
  const { rerender } = render(view(true));

  const term = screen.getByRole('combobox', { name: 'Vocabulary' });
  expect(term).toHaveValue('');
  expect(term).toHaveClass('!bg-amber-100', '!ring-amber-600');
  expect(term).toHaveAccessibleDescription('Unmapped Darwin Core term');

  rerender(view(false));
  expect(term).not.toHaveClass('!bg-amber-100', '!ring-amber-600');
  expect(term).not.toHaveAccessibleDescription();
});

test('shows the template selector on the page for empty and populated mappings', () => {
  const [mapping] = parseDefinition(`
    <archive>
      <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
        <files><location>Occurrence.csv</location></files>
        <queries><query name="occurrence.csv" contextTableId="1" /></queries>
      </core>
    </archive>
  `);
  expect(mapping).toBeDefined();
  const onChange = jest.fn();
  const onTemplate = jest.fn();
  const view = (fields: NonNullable<typeof mapping>['fields']): JSX.Element => (
    <UnloadProtectsContext.Provider value={[]}>
      <QueryMapping
        mapping={{ ...mapping!, fields, fileName: 'Occurrence.csv' }}
        hasMappingsToReset={false}
        hasFileNameError={false}
        onCoreChange={jest.fn()}
        onChange={onChange}
        onTemplate={onTemplate}
      />
    </UnloadProtectsContext.Provider>
  );
  const { rerender } = render(view(mapping!.fields));

  expect(
    screen.getByRole('combobox', { name: 'Row type' })
  ).toBeInTheDocument();
  expect(screen.queryByText('File name')).not.toBeInTheDocument();
  expect(screen.getByText('Choose Template or Query')).toBeInTheDocument();
  expect(
    screen.getByRole('combobox', { name: 'Row type' }).closest('label')
      ?.nextElementSibling
  ).toBe(
    screen
      .getByRole('combobox', { name: 'Choose Template or Query' })
      .closest('label')
  );

  fireEvent.click(screen.getByRole('button', { name: /Mapping settings/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('File name')).toBeInTheDocument();
  expect(
    within(screen.getByRole('dialog')).queryByRole('combobox', {
      name: 'Choose Template or Query',
    })
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'File name' }), {
    target: { value: 'renamed.csv' },
  });
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ fileName: 'renamed.csv' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  const [populatedMapping] = parseDefinition(defaultTemplates[0]!.definition);
  rerender(view(populatedMapping!.fields));
  expect(
    screen.getByRole('combobox', { name: 'Choose Template or Query' })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Mapping settings/i }));
  expect(
    within(screen.getByRole('dialog')).queryByRole('combobox', {
      name: 'Choose Template or Query',
    })
  ).not.toBeInTheDocument();
});

test('places the template selector directly after the extension field', () => {
  const [mapping] = parseDefinition(`
    <archive>
      <extension rowType="http://rs.tdwg.org/ac/terms/Multimedia">
        <queries><query name="Multimedia.csv" contextTableId="1" /></queries>
      </extension>
    </archive>
  `);
  expect(mapping).toBeDefined();
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <QueryMapping
        mapping={mapping!}
        hasMappingsToReset={false}
        hasFileNameError={false}
        onCoreChange={jest.fn()}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />
    </UnloadProtectsContext.Provider>
  );

  expect(
    screen.getByRole('combobox', { name: 'Extension' }).closest('label')
      ?.nextElementSibling
  ).toBe(
    screen
      .getByRole('combobox', { name: 'Choose Template or Query' })
      .closest('label')
  );
});

test('confirms before choosing a template even for a new mapping', () => {
  const [mapping] = parseDefinition(`
    <archive>
      <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
        <queries><query name="occurrence.csv" contextTableId="1" /></queries>
      </core>
    </archive>
  `);
  const onTemplate = jest.fn();
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <QueryMapping
        mapping={{ ...mapping!, fileName: 'Occurrence.csv' }}
        hasMappingsToReset={false}
        hasFileNameError={false}
        onCoreChange={jest.fn()}
        onChange={jest.fn()}
        onTemplate={onTemplate}
      />
    </UnloadProtectsContext.Provider>
  );
  const templateSelect = screen.getByRole('combobox', {
    name: 'Choose Template or Query',
  });
  const templateOption = templateSelect.querySelector(
    'option[value^="template:"]'
  );
  expect(templateOption).not.toBeNull();
  fireEvent.change(templateSelect, {
    target: { value: templateOption?.getAttribute('value') },
  });
  expect(onTemplate).not.toHaveBeenCalled();
  expect(
    screen.getByRole('dialog', { name: 'Replace the current mapping?' })
  ).toBeInTheDocument();
});

test('confirms before replacing an existing mapping with a template', () => {
  const [mapping] = parseDefinition(defaultTemplates[0]!.definition);
  expect(mapping).toBeDefined();
  const onTemplate = jest.fn();
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <QueryMapping
        mapping={mapping!}
        hasMappingsToReset
        hasFileNameError={false}
        onCoreChange={jest.fn()}
        onChange={jest.fn()}
        onTemplate={onTemplate}
      />
    </UnloadProtectsContext.Provider>
  );
  const selectTemplate = (): void => {
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Choose Template or Query' }),
      { target: { value: `template:${defaultTemplates[0]!.name}` } }
    );
  };

  selectTemplate();
  expect(onTemplate).not.toHaveBeenCalled();
  expect(
    screen.getByRole('dialog', { name: 'Replace the current mapping?' })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onTemplate).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  selectTemplate();
  fireEvent.click(screen.getByRole('button', { name: 'Replace mapping' }));
  expect(onTemplate).toHaveBeenCalledWith(defaultTemplates[0]);
});

test('confirms before fetching a replacement saved query', () => {
  const [mapping] = parseDefinition(defaultTemplates[0]!.definition);
  expect(mapping).toBeDefined();
  mockSavedQueries = {
    records: [
      {
        id: 42,
        name: 'Replacement query',
        contextTableId: mapping!.baseTable.tableId,
      },
    ],
  };
  const fetchQuery = jest
    .spyOn(resourceModule, 'fetchResource')
    .mockResolvedValue(undefined as never);
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <QueryMapping
        mapping={mapping!}
        hasMappingsToReset
        hasFileNameError={false}
        onCoreChange={jest.fn()}
        onChange={jest.fn()}
      />
    </UnloadProtectsContext.Provider>
  );
  const selectQuery = (): void => {
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Choose Template or Query' }),
      { target: { value: 'query:42' } }
    );
  };

  expect(
    screen.getByRole('combobox', { name: 'Choose Template or Query' })
  ).toHaveTextContent('Replacement query');
  expect(
    screen.queryByRole('group', { name: 'Templates' })
  ).not.toBeInTheDocument();

  selectQuery();
  expect(fetchQuery).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(fetchQuery).not.toHaveBeenCalled();

  selectQuery();
  fireEvent.click(screen.getByRole('button', { name: 'Replace mapping' }));
  expect(fetchQuery).toHaveBeenCalledWith('SpQuery', 42);
});

test('flags a file-name problem on the settings control', () => {
  const [mapping] = parseDefinition(`
    <archive>
      <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
        <queries><query name="occurrence.csv" contextTableId="1" /></queries>
      </core>
    </archive>
  `);
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <QueryMapping
        mapping={{ ...mapping!, fileName: '' }}
        hasMappingsToReset={false}
        hasFileNameError
        onCoreChange={jest.fn()}
        onChange={jest.fn()}
      />
    </UnloadProtectsContext.Provider>
  );
  expect(screen.getByText('Check file name in settings')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Mapping settings/i })).toHaveClass(
    'ring-2'
  );
});
