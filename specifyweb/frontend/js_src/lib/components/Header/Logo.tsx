import React from 'react';

import { useHueDifference } from '../../hooks/useHueDifference';
import { commonText } from '../../localization/common';
import { userPreferences } from '../Preferences/userPreferences';

export function Logo({
  isCollapsed,
  isHorizontal,
}: {
  readonly isCollapsed: boolean;
  readonly isHorizontal: boolean;
}): JSX.Element {
  const [logo] = userPreferences.use('header', 'appearance', 'customLogo');
  const [collapsedLogo] = userPreferences.use(
    'header',
    'appearance',
    'customLogoCollapsed'
  );
  const hueDifference = useHueDifference();

  return (
    <h1 className="contents">
      <a
        className={`
      flex items-center gap-2
      ${isCollapsed ? 'p-2' : 'p-4'}
      ${isHorizontal ? '' : 'flex-col'}
    `}
        href="/specify/"
      >
        {/* Both logs are loaded to prevent flickering on collapse/expand */}
        <img
          alt=""
          className={`
        hover:animate-hue-rotate
        ${isCollapsed ? 'hidden' : ''}
      `}
          src="/static/img/logo.svg"
          style={{ filter: `hue-rotate(${hueDifference}deg)` }}
        />
        <img
          alt=""
          className={`
      hover:animate-hue-rotate
      ${isCollapsed ? '' : 'hidden'}
      ${isHorizontal ? 'w-10' : ''}
    `}
          src="/static/img/short_logo.svg"
          style={{ filter: `hue-rotate(${hueDifference}deg)` }}
        />
        {logo === '' ? (
          ''
        ) : (
          <img
            alt=""
            className={`max-h-[theme(spacing.24)] max-w-[theme(spacing.24)]
        hover:animate-hue-rotate
        ${isCollapsed ? 'hidden' : ''}
      `}
            crossOrigin="anonymous"
            src={logo}
          />
        )}
        {collapsedLogo === '' ? (
          ''
        ) : (
          <img
            alt=""
            className={`max-h-[theme(spacing.16)] max-w-[theme(spacing.16)]
      hover:animate-hue-rotate
      ${isCollapsed ? '' : 'hidden'}
      ${isHorizontal ? 'w-10' : ''}
    `}
            crossOrigin="anonymous"
            src={collapsedLogo}
          />
        )}
        <span className="sr-only">{commonText.goToHomepage()}</span>
      </a>
    </h1>
  );
}
