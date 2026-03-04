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
          flex items-center mb-4
          ${isHorizontal ? '' : 'flex-col'}
        `}
        href="/specify/"
      >
        {/* Expanded logo */}
        <img
          alt=""
          className={`
            hover:animate-hue-rotate
            max-w-full h-auto object-contain
            ${isCollapsed ? 'hidden' : ''}
          `}
          src="/static/img/new_logo.png"
          style={{ filter: `hue-rotate(${hueDifference}deg)` }}
        />

        {/* Collapsed logo */}
        <img
          alt=""
          className={`
            hover:animate-hue-rotate
            max-w-full h-auto object-contain
            ${isCollapsed ? '' : 'hidden'}
            ${isHorizontal ? 'w-10' : ''}
          `}
          src="/static/img/new_short_logo.png"
          style={{ filter: `hue-rotate(${hueDifference}deg)` }}
        />

        {logo === '' ? (
          ''
        ) : (
          <img
            alt=""
            className={`
              hover:animate-hue-rotate
              max-w-full h-auto object-contain
              ${isCollapsed ? 'hidden' : ''}
            `}
            src={logo}
          />
        )}

        {collapsedLogo === '' ? (
          ''
        ) : (
          <img
            alt=""
            className={`
              hover:animate-hue-rotate
              max-w-full h-auto object-contain
              ${isCollapsed ? '' : 'hidden'}
              ${isHorizontal ? 'w-10' : ''}
            `}
            src={collapsedLogo}
          />
        )}

        <span className="sr-only">{commonText.goToHomepage()}</span>
      </a>
    </h1>
  );
}
