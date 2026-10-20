import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';

import { requireContext } from '../../../tests/helpers';
import { LoadingContext } from '../../Core/Contexts';
import * as collectionModule from '../../DataModel/collection';
import { tables } from '../../DataModel/tables';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { DwcaDefinitionEditor } from '../DwcaDefinition';

jest.mock('../../QueryBuilder/Wrapped', () => ({
  QueryBuilder: (): null => null,
}));

requireContext();

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
  fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
  expect(screen.getByRole('button', { name: 'Extension' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.not.stringContaining('rowType="custom"')
  );
});
