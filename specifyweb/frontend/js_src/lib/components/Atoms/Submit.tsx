// Force passing children by nesting rather than through the [value] attribute
import type { LocalizedString } from 'typesafe-i18n';

import { className } from './className';
import type { TagProps } from './wrapper';
import { wrap } from './wrapper';

type SubmitProps = {
  readonly children: LocalizedString;
  readonly value?: undefined;
  readonly title?: LocalizedString | undefined;
  readonly 'aria-label'?: LocalizedString | undefined;
};
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const submitButton = (name: string, buttonClassName: string) =>
  wrap<'input', SubmitProps>(
    name,
    'input',
    buttonClassName,
    ({
      children,
      ...props
    }: SubmitProps & TagProps<'input'>): TagProps<'input'> => ({
      type: 'submit',
      ...props,
      value: children,
    })
  );

export const Submit = {
  Small: submitButton(
    'Submit.Small',
    `${className.smallButton} ${className.defaultSmallButtonVariant}`
  ),
  Fancy: submitButton(
    'Submit.Fancy',
    `${className.niceButton} ${className.fancyButton} !inline`
  ),
  Secondary: submitButton(
    'Submit.Secondary',
    `${className.niceButton} ${className.secondaryButton}`
  ),
  Danger: submitButton(
    'Submit.Danger',
    `${className.niceButton} ${className.dangerButton}`
  ),
  Info: submitButton(
    'Submit.Info',
    `${className.niceButton} ${className.infoButton}`
  ),
  Warning: submitButton(
    'Submit.Warning',
    `${className.niceButton} ${className.warningButton}`
  ),
  Success: submitButton(
    'Submit.Success',
    `${className.niceButton} ${className.successButton}`
  ),
  Save: submitButton(
    'Submit.Save',
    `${className.niceButton} ${className.saveButton}`
  ),
} as const;
