import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';

import { requireContext } from '../../../tests/helpers';
import { LoadingContext } from '../../Core/Contexts';
import * as collectionModule from '../../DataModel/collection';
import { getField } from '../../DataModel/helpers';
import { getFieldBlockers } from '../../DataModel/saveBlockers';
import { tables } from '../../DataModel/tables';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { DwcaDefinitionEditor } from '../DwcaDefinition';

jest.mock('../../QueryBuilder/Wrapped', () => ({
  QueryBuilder: (): null => null,
}));

requireContext();

test('offers the XML editor when the definition is invalid', async () => {
  const onSwitchToXmlEditor = jest.fn();
  await act(async () => {
    render(
      <DwcaDefinitionEditor
        {...({
          data: '<archive><core></archive>',
          onSwitchToXmlEditor,
        } as unknown as Parameters<typeof DwcaDefinitionEditor>[0])}
      />
    );
  });
  expect(screen.getByRole('alert')).toHaveTextContent('invalid XML');
  fireEvent.click(screen.getByRole('button', { name: 'Open XML Editor' }));
  expect(onSwitchToXmlEditor).toHaveBeenCalledTimes(1);
});

test('clears visual editor save blockers when switching editors', async () => {
  jest
    .spyOn(collectionModule, 'fetchCollection')
    .mockImplementation(() => new Promise(() => undefined));
  const appResource = new tables.SpAppResource.Resource({ name: 'DwCA' });
  const dataField = getField(appResource.specifyTable, 'spAppResourceDatas');
  const { unmount } = render(
    <MemoryRouter>
      <LoadingContext.Provider value={() => undefined}>
        <UnloadProtectsContext.Provider value={[]}>
          <DwcaDefinitionEditor
            {...({
              appResource,
              data: '<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query contextTableId="1" name=""><id stringId="1.collectionobject.guid" /></query></queries></core></archive>',
              onChange: jest.fn(),
            } as unknown as Parameters<typeof DwcaDefinitionEditor>[0])}
          />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    </MemoryRouter>
  );
  expect(
    await screen.findByRole('button', { name: 'Core' })
  ).toBeInTheDocument();
  expect(getFieldBlockers(appResource, dataField)).toEqual([
    'Field is required.',
  ]);
  unmount();
  expect(getFieldBlockers(appResource, dataField)).toEqual([]);
});

test('hides a mismatched extension and lets the user remove it', async () => {
  jest
    .spyOn(collectionModule, 'fetchCollection')
    .mockImplementation(() => new Promise(() => undefined));
  const onChange = jest.fn();
  const appResource = new tables.SpAppResource.Resource({ name: 'DwCA' });
  render(
    <MemoryRouter>
      <LoadingContext.Provider value={() => undefined}>
        <UnloadProtectsContext.Provider value={[]}>
          <DwcaDefinitionEditor
            {...({
              appResource,
              data: '<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query contextTableId="1" /></queries></core><extension rowType="custom"><queries><query contextTableId="121" /></queries></extension><extension rowType="second"><queries><query contextTableId="1" /></queries></extension></archive>',
              onChange,
            } as unknown as Parameters<typeof DwcaDefinitionEditor>[0])}
          />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    </MemoryRouter>
  );
  expect(
    await screen.findByRole('button', { name: 'Core' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'custom' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Extension' }));
  fireEvent.click(
    screen.getByRole('button', { name: /different context table/ })
  );
  expect(
    screen.getByText(/correct its Table ID in the XML editor/)
  ).toBeInTheDocument();
  const remove = screen.getByRole('button', { name: 'Remove' });
  expect(remove.closest('li')).toHaveTextContent('custom: Remove');
  expect(remove).toHaveClass('underline');
  fireEvent.click(remove);
  expect(screen.getByRole('button', { name: 'Extension' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.not.stringContaining('rowType="custom"')
  );
});
