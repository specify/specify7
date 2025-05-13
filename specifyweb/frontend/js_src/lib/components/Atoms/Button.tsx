import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import type { RA } from '../../utils/types';
import { softFail } from '../Errors/Crash';
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
  component: ButtonComponent = Button.Secondary,
  ...props
}: Omit<Parameters<typeof Button.Secondary>[0], 'onClick'> & {
  readonly component?: typeof Button.Secondary;
}): JSX.Element | null {
  const handleClose = React.useContext(DialogContext);
  if (handleClose === undefined) {
    softFail(new Error("Dialog's handleClose prop is undefined"));
    return null;
  }
  return <ButtonComponent {...props} onClick={handleClose} />;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const button = (name: string, className: string) =>
  wrap<
    'button',
    {
      readonly onClick:
        | ((event: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
      readonly children?:
        | JSX.Element
        | LocalizedString
        | RA<JSX.Element | LocalizedString | false | undefined>;
      readonly title?: LocalizedString | undefined;
      readonly 'aria-label'?: LocalizedString | undefined;
    }
  >(name, 'button', className, (props) => ({
    ...props,
    type: 'button',
    disabled: props.disabled === true || props.onClick === undefined,
  }));

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
      readonly onClick:
        | ((event: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
    }
  >(
    'Button.Small',
    'button',
    className.smallButton,
    ({
      variant = className.defaultSmallButtonVariant,
      type,
      className: classString = '',
      disabled,
      ...props
    }) => ({
      type: 'button',
      className: `${classString} ${variant}`,
      disabled: disabled === true || props.onClick === undefined,
      ...props,
    })
  ),
  Fancy: button(
    'Button.LikeLink',
    `${className.niceButton} ${className.fancyButton}`
  ),
  Secondary: button(
    'Button.Secondary',
    `${className.niceButton} ${className.secondaryButton}`
  ),
  BorderedGray: button(
    'Button.BorderedGray',
    `${className.niceButton} ${className.borderedGrayButton}`
  ),
  Danger: button(
    'Button.Danger',
    `${className.niceButton} ${className.dangerButton}`
  ),
  Info: button(
    'Button.Info',
    `${className.niceButton} ${className.infoButton}`
  ),
  Warning: button(
    'Button.Warning',
    `${className.niceButton} ${className.warningButton}`
  ),
  Success: button(
    'Button.Success',
    `${className.niceButton} ${className.successButton}`
  ),
  Save: button(
    'Button.Save',
    `${className.niceButton} ${className.saveButton}`
  ),
  DialogClose: DialogCloseButton,
  Icon: wrap<
    'button',
    IconProps & {
      readonly onClick:
        | ((event: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
    }
  >(
    'Button.Icon',
    'button',
    `${className.icon} rounded`,
    ({ icon, ...props }) => ({
      ...props,
      'aria-label': props['aria-label'] ?? props.title,
      type: 'button',
      disabled: props.disabled === true || props.onClick === undefined,
      children: icons[icon],
    })
  ),
} as const;
