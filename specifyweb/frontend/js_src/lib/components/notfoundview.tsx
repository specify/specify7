import React from 'react';

import { commonText } from '../localization/common';
import { Container, H2 } from './basic';
import { createBackboneView } from './reactbackboneextend';

export function NotFound(): JSX.Element {
  return (
    <Container.FullGray>
      <Container.Base>
        <H2>{commonText('pageNotFound')}</H2>
      </Container.Base>
    </Container.FullGray>
  );
}

export const NotFoundView = createBackboneView(NotFound);
