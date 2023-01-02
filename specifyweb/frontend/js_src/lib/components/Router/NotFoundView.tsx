import React from 'react';

import { mainText } from '../../localization/main';
import { Http } from '../../utils/ajax/definitions';
import { Container } from '../Atoms';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { useTitle } from '../Molecules/AppTitle';

export function NotFoundView({
  container = true,
}: {
  readonly container?: boolean;
}): JSX.Element {
  useTitle(mainText.pageNotFound());
  const content = (
    <Container.Center className="flex flex-1">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h2
          aria-label={mainText.pageNotFound()}
          className="py-2 text-9xl text-indigo-300"
        >
          {Http.NOT_FOUND}
        </h2>
        <p>{mainText.nothingWasFound()}</p>
        <p>{mainText.pageNotFoundDescription()}</p>
        <Link.Default href="/specify/">
          {icons.arrowLeft}
          {mainText.returnToHomepage()}
        </Link.Default>
      </div>
    </Container.Center>
  );
  return container ? (
    <Container.FullGray>{content}</Container.FullGray>
  ) : (
    content
  );
}
