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
  Gray: submitButton(
    'Submit.Gray',
    `${className.niceButton} ${className.secondaryButton}`
  ),
  Red: submitButton(
    'Submit.Red',
    `${className.niceButton} ${className.dangerButton}`
  ),
  Blue: submitButton(
    'Submit.Blue',
    `${className.niceButton} ${className.infoButton}`
  ),
  Orange: submitButton(
    'Submit.Orange',
    `${className.niceButton} ${className.warningButton}`
  ),
  Green: submitButton(
    'Submit.Green',
    `${className.niceButton} ${className.successButton}`
  ),
  Save: submitButton(
    'Submit.Save',
    `${className.niceButton} ${className.saveButton}`
  ),
} as const;
