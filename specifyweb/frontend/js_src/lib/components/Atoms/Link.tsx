import { IR, RR } from '../../utils/types';
import { TagProps, wrap } from './wrapper';
import { className } from './className';
import { commonText } from '../../localization/common';
import { IconProps, icons } from './Icons';
import React from 'react';

/**
 * A wrapper for wrap() to generate links that have [href] attribute required
 */
const linkComponent = <EXTRA_PROPS extends IR<unknown> = RR<never, never>>(
  name: string,
  className: string,
  initialProps?:
    | TagProps<'a'>
    | ((props: Readonly<EXTRA_PROPS> & TagProps<'a'>) => TagProps<'a'>)
) =>
  wrap<'a', EXTRA_PROPS & { readonly href: string }>(
    name,
    'a',
    className,
    initialProps
  );

export const Link = {
  Default: linkComponent('Link.Default', className.link),
  NewTab: linkComponent('Link.NewTab', className.link, (props) => ({
    ...props,
    target: '_blank',
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
  Gray: linkComponent(
    'Link.Gray',
    `${className.niceButton} ${className.grayButton}`
  ),
  BorderedGray: linkComponent(
    'Link.BorderedGray',
    `${className.niceButton} ${className.borderedGrayButton}`
  ),
  Red: linkComponent(
    'Link.Red',
    `${className.niceButton} ${className.redButton}`
  ),
  Blue: linkComponent(
    'Link.Blue',
    `${className.niceButton} ${className.blueButton}`
  ),
  Orange: linkComponent(
    'Link.Orange',
    `${className.niceButton} ${className.orangeButton}`
  ),
  Green: linkComponent(
    'Link.Green',
    `${className.niceButton} ${className.greenButton}`
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
