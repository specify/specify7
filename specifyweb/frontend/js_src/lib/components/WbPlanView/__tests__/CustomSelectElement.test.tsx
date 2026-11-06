import { render, screen } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { localized } from '../../../utils/types';
import { CustomSelectElement } from '../CustomSelectElement';

requireContext();

test('keeps the field mapper at a compact width', () => {
  render(
    <CustomSelectElement
      customSelectOptionGroups={{
        fields: {
          selectOptionsData: {
            field: { optionLabel: 'Field' },
          },
        },
      }}
      customSelectType="OPENED_LIST"
      fieldSearch={<input aria-label="Search fields" />}
      isOpen
      selectLabel={localized('Collection Object')}
    />
  );

  expect(screen.getByRole('article')).toHaveStyle({
    width: '20rem',
    maxWidth: 'calc(100vw - 4rem)',
  });
});
