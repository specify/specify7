import React from 'react';

import { commonText } from '../localization/common';
import { Container } from './basic';

export function PermissionDenied(): JSX.Element {
  return (
    <Container.FullGray>
      <Container.Center>
        <h2>{commonText('accessDenied')}</h2>
        <p>{commonText('noPermissionForAction')}</p>
      </Container.Center>
    </Container.FullGray>
  );
}
