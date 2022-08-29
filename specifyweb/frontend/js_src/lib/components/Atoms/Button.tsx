import React from 'react';

import { className } from './className';
import type { IconProps } from './Icons';
import { icons } from './Icons';
import { wrap } from './wrapper';

export const DialogContext = React.createContext<(() => void) | undefined>(
  undefined
);
DialogContext.displayName = 'DialogContext';

/**
 * A button that registers its onClick handler to containing dialog's
 * onClose handler.
 *
 * This is useful to avoid duplicating the dialog close logic
 * in the button's onClick and the dialog's onClose
 */
function DialogCloseButton({
  component: ButtonComponent = Button.Gray,
  ...props
}: Omit<Parameters<typeof Button.Gray>[0], 'onClick'> & {
  readonly component?: typeof Button.Gray;
}): JSX.Element {
  const handleClose = React.useContext(DialogContext);
  if (handleClose === undefined)
    throw new Error("Dialog's handleClose prop is undefined");
  return <ButtonComponent {...props} onClick={handleClose} />;
}

const button = (name: string, className: string) =>
  wrap<
    'button',
    {
      readonly onClick:
        | ((event: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
    }
  >(name, 'button', className, (props) => ({
    ...props,
    type: 'button',
    disabled: props.disabled === true || props.onClick === undefined,
  }));
/*
 * FEATURE: if onClick===undefined, button should be disabled, but only if expicily
 *   provided
 */
export const Button = {
  /*
   * When using Button.LikeLink component, consider adding [role="link"] if the
   * element should be announced as a link
   */
  LikeLink: button('Button.LikeLink', className.link),
  Small: wrap<
    'button',
    {
      /*
       * A class name that is responsible for text and background color
       * Split into a separate prop in order to add a default value
       */
      readonly variant?: string;
    }
  >(
    'Button.Small',
    'button',
    className.smallButton,
    ({
      variant = className.defaultSmallButtonVariant,
      type,
      className: classString = '',
      ...props
    }) => ({
      type: 'button',
      className: `${classString} ${variant}`,
      ...props,
    })
  ),
  Fancy: button(
    'Button.LikeLink',
    `${className.niceButton} ${className.fancyButton}`
  ),
  Gray: button(
    'Button.Gray',
    `${className.niceButton} ${className.grayButton}`
  ),
  BorderedGray: button(
    'Button.BorderedGray',
    `${className.niceButton} ${className.borderedGrayButton}`
  ),
  Red: button('Button.Red', `${className.niceButton} ${className.redButton}`),
  Blue: button(
    'Button.Blue',
    `${className.niceButton} ${className.blueButton}`
  ),
  Orange: button(
    'Button.Orange',
    `${className.niceButton} ${className.orangeButton}`
  ),
  Green: button(
    'Button.Green',
    `${className.niceButton} ${className.greenButton}`
  ),
  DialogClose: DialogCloseButton,
  Icon: wrap<
    'button',
    IconProps & {
      readonly onClick:
        | ((event: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
    }
  >('Button.Icon', 'button', `${className.icon} rounded`, (props) => ({
    ...props,
    'aria-label': props['aria-label'] ?? props.title,
    type: 'button',
    children: icons[props.icon],
  })),
} as const;
