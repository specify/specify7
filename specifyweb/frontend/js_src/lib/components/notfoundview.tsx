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
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <h2
            className="py-2 text-9xl text-indigo-300"
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
