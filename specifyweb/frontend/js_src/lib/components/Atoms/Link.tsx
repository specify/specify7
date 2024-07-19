import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import type { IR, RA, RR } from '../../utils/types';
import { className } from './className';
import type { IconProps } from './Icons';
import { icons } from './Icons';
import type { TagProps } from './wrapper';
import { wrap } from './wrapper';

/**
 * A wrapper for wrap() to generate links that have [href] attribute required
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const linkComponent = <EXTRA_PROPS extends IR<unknown> = RR<never, never>>(
  name: string,
  className: string,
  initialProps?:
    | TagProps<'a'>
    | ((props: Readonly<EXTRA_PROPS> & TagProps<'a'>) => TagProps<'a'>)
) =>
  wrap<
    'a',
    EXTRA_PROPS & {
      readonly href: string | undefined;
      readonly children?:
        | JSX.Element
        | LocalizedString
        | RA<JSX.Element | LocalizedString | false | undefined>;
      readonly title?: LocalizedString | undefined;
      readonly 'aria-label'?: LocalizedString | undefined;
    }
  >(name, 'a', className, initialProps);

export const Link = {
  Default: linkComponent('Link.Default', className.link),
  NewTab: linkComponent('Link.NewTab', className.link, (props) => ({
    ...props,
    target: '_blank',
    rel: 'noopener',
    children: (
      <>
        {props.children}
        <span title={commonText.opensInNewTab()}>
          <span className="sr-only">{commonText.opensInNewTab()}</span>
          {icons.externalLink}
        </span>
      </>
    ),
  })),
  Small: linkComponent<{
    /*
     * A class name that is responsible for text and background color
     * Split into a separate prop in order to add a default value
     */
    readonly variant?: string;
  }>(
    'Link.Small',
    className.smallButton,
    ({
      variant = className.defaultSmallButtonVariant,
      className: classString = '',
      ...props
    }) => ({
      className: `${classString} ${variant}`,
      ...props,
    })
  ),
  Fancy: linkComponent(
    'Link.Fancy',
    `${className.niceButton} ${className.fancyButton}`
  ),
  Secondary: linkComponent(
    'Link.Secondary',
    `${className.niceButton} ${className.secondaryButton}`
  ),
  BorderedGray: linkComponent(
    'Link.BorderedGray',
    `${className.niceButton} ${className.borderedGrayButton}`
  ),
  Danger: linkComponent(
    'Link.Danger',
    `${className.niceButton} ${className.dangerButton}`
  ),
  Info: linkComponent(
    'Link.Info',
    `${className.niceButton} ${className.infoButton}`
  ),
  Warning: linkComponent(
    'Link.Warning',
    `${className.niceButton} ${className.warningButton}`
  ),
  Success: linkComponent(
    'Link.Success',
    `${className.niceButton} ${className.successButton}`
  ),
  Icon: linkComponent<IconProps>(
    'Link.Icon',
    `${className.icon} rounded`,
    ({ icon, ...props }) => ({
      ...props,
      'aria-label': props['aria-label'] ?? props.title,
      children: icons[icon],
    })
  ),
} as const;
