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
    `${className.niceButton} ${className.grayButton}`
  ),
  Red: submitButton(
    'Submit.Red',
    `${className.niceButton} ${className.redButton}`
  ),
  Blue: submitButton(
    'Submit.Blue',
    `${className.niceButton} ${className.blueButton}`
  ),
  Orange: submitButton(
    'Submit.Orange',
    `${className.niceButton} ${className.orangeButton}`
  ),
  Specify: submitButton(
    'Submit.Specify',
    `${className.niceButton} ${className.specifyButton}`
  ),
  Green: submitButton(
    'Submit.Green',
    `${className.niceButton} ${className.greenButton}`
  ),
} as const;
