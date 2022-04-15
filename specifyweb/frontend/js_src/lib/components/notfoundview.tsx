import React from 'react';

import { commonText } from '../localization/common';
import { Container, H2 } from './basic';
import { createBackboneView } from './reactbackboneextend';

export function NotFound(): JSX.Element {
  return (
    <Container.Full>
      <H2>{commonText('pageNotFound')}</H2>
    </Container.Full>
  );
}

export const NotFoundView = createBackboneView(NotFound);
