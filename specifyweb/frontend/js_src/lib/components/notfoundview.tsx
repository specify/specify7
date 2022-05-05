import React from 'react';

import { commonText } from '../localization/common';
import { Container, H2 } from './basic';

export function NotFoundView(): JSX.Element {
  return (
    <Container.FullGray>
      <Container.Center>
        <H2>{commonText('pageNotFound')}</H2>
      </Container.Center>
    </Container.FullGray>
  );
}
