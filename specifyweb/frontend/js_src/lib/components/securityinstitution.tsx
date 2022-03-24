import React from 'react';

import type { Institution } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { Button, Container, H3 } from './basic';

export function InstitutionView({
  institution,
}: {
  readonly institution: SpecifyResource<Institution>;
}): JSX.Element {
  return (
    <Container.Base className="flex-1">
      <H3>{institution.get('name')}</H3>
      <div className="flex flex-col gap-2">
        <h4>{adminText('admins')}</h4>
        <div>
          <Button.Green>{commonText('add')}</Button.Green>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h4>{adminText('userRoleLibrary')}</h4>
        <div>
          <Button.Green>{commonText('add')}</Button.Green>
        </div>
      </div>
    </Container.Base>
  );
}
