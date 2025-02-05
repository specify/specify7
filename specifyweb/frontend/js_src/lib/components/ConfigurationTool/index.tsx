import React from 'react';

import { configurationText } from '../../localization/configurationText';
import { Container, H2 } from '../Atoms';

export function ConfigurationTool(): JSX.Element {
 return (
      <Container.FullGray>
        <H2 className="text-2xl">{configurationText.specifySetUp()}</H2>
      </Container.FullGray>
 )
}