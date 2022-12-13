// Force passing children by nesting rather than through the [value] attribute
import {className} from './className';
import type {TagProps} from './wrapper';
import { wrap} from './wrapper';

type SubmitProps = {
  readonly children: string;
  readonly value?: undefined;
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
  Green: submitButton(
    'Submit.Green',
    `${className.niceButton} ${className.greenButton}`
  ),
} as const;
