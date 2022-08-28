import { render } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { ErrorMessage } from '../index';

test('ErrorMessage renders without errors', () => {
  const { asFragment } = render(
    <ErrorMessage>{commonText('title')}</ErrorMessage>,
    {}
  );

  expect(asFragment()).toMatchSnapshot();
});
