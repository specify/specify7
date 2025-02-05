import React from 'react';

import { preferencesText } from '../../localization/preferences';
import { Container, H2 } from '../Atoms';

export function ConfigurationTool(): JSX.Element {
 return (
      <Container.FullGray>
        <H2 className="text-2xl">{preferencesText.preferences()}</H2>
      </Container.FullGray>
 )
}