import React from 'react';

import type { Institution } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import { Button, className, Container } from './basic';

// FIXME: UI for superuser
export function InstitutionView({
  institution,
}: {
  readonly institution: SpecifyResource<Institution>;
}): JSX.Element {
  return (
    <Container.Base className="flex-1 overflow-y-auto">
      <h3 className="text-xl">{institution.get('name')}</h3>
      <div className="flex flex-col gap-2">
        <h4 className={className.headerGray}>{adminText('admins')}</h4>
        <div>
          <Button.Green>{commonText('add')}</Button.Green>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h4 className={className.headerGray}>{adminText('userRoleLibrary')}</h4>
        <div>
          <Button.Green>{commonText('add')}</Button.Green>
        </div>
      </div>
    </Container.Base>
  );
}
