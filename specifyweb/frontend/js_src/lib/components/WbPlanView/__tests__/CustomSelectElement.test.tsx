import { render, screen } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { localized } from '../../../utils/types';
import { CustomSelectElement } from '../CustomSelectElement';

requireContext();

test.each([320, 1280])(
  'applies width styles and label wrapping classes with innerWidth set to %i',
  (viewportWidth) => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: viewportWidth,
    });
    const longLabel =
      'A very long field label that must wrap inside the mapping column';
    render(
      <CustomSelectElement
        customSelectOptionGroups={{
          fields: {
            selectOptionsData: {
              field: { optionLabel: longLabel },
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
      maxWidth: 'min(100%, calc(100vw - 4rem))',
    });
    expect(screen.getByRole('listbox')).toHaveClass('min-w-0');
    expect(screen.getByText(longLabel)).toHaveClass(
      'min-w-0',
      'whitespace-normal',
      'break-words'
    );
  }
);
