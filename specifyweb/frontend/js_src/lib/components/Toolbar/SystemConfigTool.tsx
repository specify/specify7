import React from 'react';

import { userText } from '../../localization/user';
import { Container, H2 } from '../Atoms';

export function SystemConfigurationTool(): JSX.Element | null {
  
  return (
    <Container.FullGray>
      <H2 className="text-2xl">{userText.systemConfigurationTool()}</H2>
      <div className="flex h-0 flex-1 flex-col gap-4 md:flex-row" />
    </Container.FullGray>
  );
}