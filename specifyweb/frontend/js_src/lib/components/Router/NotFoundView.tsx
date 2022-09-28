import React from 'react';

import { commonText } from '../../localization/common';
import { Container } from '../Atoms';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { useTitle } from '../Molecules/AppTitle';
import { Http } from '../../utils/ajax/definitions';

export function NotFoundView(): JSX.Element {
  useTitle(commonText('pageNotFound'));
  return (
    <Container.FullGray>
      <Container.Center className="flex flex-1">
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <h2
            aria-label={commonText('pageNotFound')}
            className="py-2 text-9xl text-indigo-300"
          >
            {Http.NOT_FOUND}
          </h2>
          <p>{commonText('nothingWasFound')}</p>
          <p>{commonText('pageNotFoundDescription')}</p>
          <Link.Default href="/specify/">
            {icons.arrowLeft}
            {commonText('returnToHomepage')}
          </Link.Default>
        </div>
      </Container.Center>
    </Container.FullGray>
  );
}
