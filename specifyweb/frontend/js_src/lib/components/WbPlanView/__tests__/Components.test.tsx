import React from 'react';

import { clearIdStore } from '../../../hooks/useId';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { tables } from '../../DataModel/tables';
import { ListOfBaseTables } from '../Components';

requireContext();

beforeEach(() => {
  clearIdStore();
});

// [WbPlanView] Prevent selecting base tables without attachments
test('hides base tables without attachments', async () => {
  const handleClick = jest.fn();

  const unrestricted = mount(<ListOfBaseTables onClick={handleClick} />);

  expect(
    unrestricted.getByRole('button', {
      name: tables.Geography.label,
    })
  ).toBeInTheDocument();

  unrestricted.unmount();

  const restricted = mount(
    <ListOfBaseTables onlyAttachmentTables onClick={handleClick} />
  );

  expect(
    restricted.queryByRole('button', {
      name: tables.Geography.label,
    })
  ).not.toBeInTheDocument();

  const accession = restricted.getByRole('button', {
    name: tables.Accession.label,
  });

  await restricted.user.click(accession);

  expect(handleClick).toHaveBeenCalledTimes(1);
  expect(handleClick).toHaveBeenCalledWith('Accession');
});
