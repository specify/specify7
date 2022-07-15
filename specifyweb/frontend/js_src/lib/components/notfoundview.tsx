import React from 'react';

import { Http } from '../ajax';
import { commonText } from '../localization/common';
import { Container, Link } from './basic';
import { useTitle } from './hooks';
import { icons } from './icons';

export function NotFoundView(): JSX.Element {
  useTitle(commonText('pageNotFound'));
  return (
    <Container.FullGray>
      <Container.Center className="flex flex-1">
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <h2
            className="text-9xl py-2 text-indigo-300"
            aria-label={commonText('pageNotFound')}
          >
            {Http.NOT_FOUND}
          </h2>
          <p>{commonText('nothingWasFound')}</p>
          <p>{commonText('pageNotFoundDescription')}</p>
          <Link.Default href="/">
            {icons.arrowLeft}
            {commonText('returnToHomepage')}
          </Link.Default>
        </div>
      </Container.Center>
    </Container.FullGray>
  );
}
