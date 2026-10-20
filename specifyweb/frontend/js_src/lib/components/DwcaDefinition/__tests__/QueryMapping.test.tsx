import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { parseDefinition, QueryMapping } from '../DwcaDefinition';

jest.mock('../../QueryBuilder/Wrapped', () => ({
  QueryBuilder: (): null => null,
}));
jest.mock('../../../hooks/useAsyncState', () => ({
  useAsyncState: (): readonly [undefined] => [undefined],
}));

requireContext();

test('keeps mapping settings behind a gear button', () => {
  const [mapping] = parseDefinition(`
    <archive>
      <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
        <files><location>occurrence.csv</location></files>
        <queries><query name="occurrence.csv" contextTableId="1" /></queries>
      </core>
    </archive>
  `);
  expect(mapping).toBeDefined();
  const onChange = jest.fn();
  const onTemplate = jest.fn();
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <QueryMapping
        mapping={mapping!}
        hasMappingsToReset={false}
        hasFileNameError={false}
        onCoreChange={jest.fn()}
        onChange={onChange}
        onTemplate={onTemplate}
      />
    </UnloadProtectsContext.Provider>
  );

  expect(
    screen.getByRole('combobox', { name: 'Row type' })
  ).toBeInTheDocument();
  expect(screen.queryByText('File name')).not.toBeInTheDocument();
  expect(
    screen.queryByText('Choose Template or Query')
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Mapping settings' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('File name')).toBeInTheDocument();
  expect(screen.getByText('Choose Template or Query')).toBeInTheDocument();
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
  expect(onTemplate).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByRole('textbox', { name: 'File name' }), {
    target: { value: 'renamed.csv' },
  });
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ fileName: 'renamed.csv' })
  );
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
  expect(screen.getByRole('button', { name: 'Mapping settings' })).toHaveClass(
    'ring-2'
  );
});
