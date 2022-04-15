import React from 'react';

import { commonText } from '../localization/common';
import { Container } from './basic';

export function PermissionDenied(): JSX.Element {
  return (
    <Container.Generic>
      <h2>{commonText('accessDenied')}</h2>
      <p>{commonText('noPermissionForAction')}</p>
    </Container.Generic>
  );
}
