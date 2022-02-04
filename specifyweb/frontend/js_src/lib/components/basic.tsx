import React from 'react';

import commonText from '../localization/common';
import type { IR, RR } from '../types';
import { capitalize } from '../wbplanviewhelper';
import type { IconProps } from './icons';
import { icons } from './icons';
import { DialogContext } from './modaldialog';

export type RawTagProps<TAG extends keyof React.ReactHTML> = Exclude<
  Parameters<React.ReactHTML[TAG]>[0],
  undefined | null
>;

/*
 * Forbid using regular "ref" since it needs to be forwarded
 * React.forwardRef has some typing issues when used with generics:
 * https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref/58473012
 * Instead, provide ref as a forwardRef. This does not change the runtime
 * behaviour
 */
export type TagProps<TAG extends keyof React.ReactHTML> = Omit<
  RawTagProps<TAG>,
  'ref'
> & {
  readonly ref?: 'Use "forwardRef" instead or "ref"';
  readonly forwardRef?: RawTagProps<TAG>['ref'];
};

export type HtmlElementFromTagName<TAG extends keyof React.ReactHTML> =
  React.ReactHTML[TAG] extends React.DetailedHTMLFactory<
    React.AnchorHTMLAttributes<infer X>,
    infer X
  >
    ? X
    : never;

// Add default className and props to common HTML elements in a type-safe way
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function wrap<
  TAG extends keyof React.ReactHTML,
  /*
   * Allows to define extra props that should be passed to the wrapped component
   * For example, can make some optional props be required, forbid passing
   * children, or mutate extra props using mergeProps callback
   */
  EXTRA_PROPS extends IR<unknown> = RR<never, never>
>(
  tagName: TAG,
  className: string,
  initialProps?:
    | TagProps<TAG>
    | ((props: TagProps<TAG> & EXTRA_PROPS) => TagProps<TAG>)
) {
  const wrapped = (props: TagProps<TAG> & EXTRA_PROPS): JSX.Element => {
    // Merge classNames
    const fullClassName =
      typeof props?.className === 'string'
        ? `${className} ${props.className}`
        : className;
    const {
      forwardRef,
      ref: _,
      ...mergedProps
    } = typeof initialProps === 'function'
      ? initialProps(props)
      : { ...initialProps, ...props };
    return React.createElement(tagName, {
      ...mergedProps,
      ref: forwardRef,
      className: fullClassName,
    });
  };
  // Use capitalized tagName as a devTool's component name
  wrapped.displayName = capitalize(tagName);
  return wrapped;
}

// TODO: make a react hook that listens for updates
const reduceMotion =
  typeof window === 'object'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
export const transitionDuration = reduceMotion ? 0 : 100;

// TODO: make a react hook that listens for updates
// TODO: allow overwriting this in the UI
export const darkMode =
  typeof window === 'object'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

// ClassNames are primarily for usage by non-react components
const niceButton = `rounded cursor-pointer active:brightness-80 px-4 py-2
  disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-neutral-700 gap-2
  inline-flex items-center`;
const baseContainer = `bg-gray-200 dark:bg-neutral-800 flex flex-col gap-2
    p-4 shadow-md shadow-gray-500 rounded`;
export const className = {
  root: `flex flex-col h-screen overflow-hidden bg-white dark:bg-neutral-900
    text-neutral-900 dark:text-neutral-200`,
  label: 'flex flex-col',
  labelForCheckbox: 'cursor-pointer inline-flex gap-x-1 items-center',
  radio: 'h-3 w-3',
  checkbox: 'h-3 w-3',
  errorMessage: 'flex gap-2 p-2 text-white bg-red-500 rounded',
  notSubmittedForm: 'not-submitted',
  notTouchedInput: 'not-touched',
  // Ensures textarea can't grow past max dialog width
  textarea: 'resize max-w-full',
  form: 'flex flex-col gap-4',
  button: 'button',
  link: 'link',
  transparentButton: `hover:bg-gray-300 hover:dark:bg-neutral-500
    text-gray-800 dark:text-neutral-200`,
  grayButton: `hover:bg-gray-400 bg-gray-300 text-gray-800
    dark:bg-neutral-600 dark:text-gray-100 hover:dark:bg-neutral-500`,
  redButton: `hover:bg-red-800 bg-red-700 text-white`,
  blueButton: `hover:bg-blue-700 bg-blue-600 text-white`,
  orangeButton: `hover:bg-orange-600 bg-orange-500 text-white`,
  greenButton: `hover:bg-green-800 bg-green-700 text-white`,
  fancyButton: `active:bg-brand-300 active:dark:bg-brand-400 bg-gray-300 gap-2
    hover:bg-brand-200 hover:dark:bg-brand:400 inline-flex dark:bg-neutral-500
    dark:text-white justify-center items-center p-2 text-black cursor-pointer
    rounded`,
  containerFull: 'flex flex-col gap-4 h-full',
  containerBase: `${baseContainer}`,
  container: `${baseContainer} max-w-[1000px] mx-auto`,
  formHeader: `specify-form-header border-b-2 border-brand-300 flex items-center
    pb-2 gap-x-4`,
  formTitle: 'view-title flex-1 text-lg',
  formLabel: 'specify-form-label text-right',
  formFooter:
    'specify-form-buttons border-brand-300 border-t-2 flex print:hidden pt-2 gap-x-2',
  queryField: `bg-white dark:bg-neutral-700 border border-gray-300 p-2 shadow
    flex gap-x-2 rounded dark:border-none`,
  h2: 'font-semibold text-black dark:text-white',
} as const;

/* eslint-disable @typescript-eslint/naming-convention */
export const Label = wrap('label', className.label);
export const LabelForCheckbox = wrap('label', className.labelForCheckbox);
export const Radio = wrap('input', className.radio, { type: 'radio' });
export const Checkbox = wrap('input', className.checkbox, { type: 'checkbox' });
export const ErrorMessage = wrap('div', className.errorMessage, {
  role: 'alert',
});
export const FormFooter = wrap('div', className.formFooter, {
  role: 'toolbar',
});
export const Form = wrap(
  'form',
  `${className.notSubmittedForm} ${className.form}`,
  (props) => ({
    ...props,
    /*
     * Don't highlight invalid [required] and pattern mismatch fields until tried
     * to submit the form
     */
    onSubmit(event): void {
      const form = event.target as HTMLFormElement;
      if (form.classList.contains(className.notSubmittedForm))
        form.classList.remove(className.notSubmittedForm);
      props?.onSubmit?.(event);
    },
  })
);
export const Input = wrap('input', className.notTouchedInput, (props) => ({
  ...props,
  /*
   * Don't highlight missing required and pattern mismatch fields until focus
   * loss
   */
  onBlur(event): void {
    const input = event.target as HTMLInputElement;
    if (input.classList.contains(className.notTouchedInput))
      input.classList.remove(className.notTouchedInput);
    props?.onBlur?.(event);
  },
}));
export const Textarea = wrap<'textarea', { readonly children?: undefined }>(
  'textarea',
  `${className.notTouchedInput} ${className.textarea}`,
  (props) => ({
    ...props,
    /*
     * Don't highlight missing required and pattern mismatch fields until focus
     * loss
     */
    onBlur(event): void {
      const textarea = event.target as HTMLTextAreaElement;
      if (textarea.classList.contains(className.notTouchedInput))
        textarea.classList.remove(className.notTouchedInput);
      props?.onBlur?.(event);
    },
  })
);
export const Select = wrap('select', className.notTouchedInput, (props) => ({
  ...props,
  /*
   * Don't highlight missing required and pattern mismatch fields until focus
   * loss
   */
  onBlur(event): void {
    const select = event.target as HTMLSelectElement;
    if (select.classList.contains(className.notTouchedInput))
      select.classList.remove(className.notTouchedInput);
    props?.onBlur?.(event);
  },
}));

export const Link = {
  Default: wrap('a', className.link),
  NewTab: wrap('a', className.link, (props) => ({
    target: '_blank',
    children: (
      <>
        {props.children}
        <span
          title={commonText('opensInNewTab')}
          aria-label={commonText('opensInNewTab')}
        >
          {icons.externalLink}
        </span>
      </>
    ),
  })),
  LikeButton: wrap('a', className.button),
  Icon: wrap<'a', IconProps>('a', className.link, (props) => ({
    ...props,
    children: icons[props.icon],
  })),
} as const;

function DialogCloseButton({
  component: ButtonComponent = Button.Transparent,
  ...props
}: Omit<Parameters<typeof Button.Transparent>[0], 'onClick'> & {
  readonly component?: typeof Button.Transparent;
}): JSX.Element {
  const handleClose = React.useContext(DialogContext);
  if (typeof handleClose === 'undefined')
    throw new Error("Dialog's handleClose prop is undefined");
  return <ButtonComponent {...props} onClick={handleClose} />;
}

export const Button = {
  Simple: wrap('button', className.button, {
    type: 'button',
  }),
  /*
   * When using Button.LikeLink component, consider adding [role="link"] if the
   * element should be announced as a link
   */
  LikeLink: wrap('button', className.link, {
    type: 'button',
  }),
  Icon: wrap<'button', IconProps>('button', className.link, (props) => ({
    ...props,
    type: 'button',
    children: icons[props.icon],
  })),
  Transparent: wrap('button', `${niceButton} ${className.transparentButton}`, {
    type: 'button',
  }),
  Gray: wrap('button', `${niceButton} ${className.grayButton}`, {
    type: 'button',
  }),
  Red: wrap('button', `${niceButton} ${className.redButton}`, {
    type: 'button',
  }),
  Blue: wrap('button', `${niceButton} ${className.blueButton}`, {
    type: 'button',
  }),
  Orange: wrap('button', `${niceButton} ${className.orangeButton}`, {
    type: 'button',
  }),
  Green: wrap('button', `${niceButton} ${className.greenButton}`, {
    type: 'button',
  }),
  DialogClose: DialogCloseButton,
} as const;

type SubmitProps = {
  readonly children: string;
  readonly value?: undefined;
};
const submitPropsMerge = ({
  children,
  ...props
}: TagProps<'input'> & SubmitProps): TagProps<'input'> => ({
  type: 'submit',
  ...props,
  value: children,
});
export const Submit = {
  // Force passing children by nesting rather than through the [value] attribute
  Simple: wrap<'input', SubmitProps>(
    'input',
    className.button,
    submitPropsMerge
  ),
  Fancy: wrap<'input', SubmitProps>(
    'input',
    className.fancyButton,
    submitPropsMerge
  ),
  Transparent: wrap<'input', SubmitProps>(
    'input',
    `${niceButton} ${className.transparentButton}`,
    submitPropsMerge
  ),
  Gray: wrap<'input', SubmitProps>(
    'input',
    `${niceButton} ${className.grayButton}`,
    submitPropsMerge
  ),
  Red: wrap<'input', SubmitProps>(
    'input',
    `${niceButton} ${className.redButton}`,
    submitPropsMerge
  ),
  Blue: wrap<'input', SubmitProps>(
    'input',
    `${niceButton} ${className.blueButton}`,
    submitPropsMerge
  ),
  Orange: wrap<'input', SubmitProps>(
    'input',
    `${niceButton} ${className.orangeButton}`,
    submitPropsMerge
  ),
  Green: wrap<'input', SubmitProps>(
    'input',
    `${niceButton} ${className.greenButton}`,
    submitPropsMerge
  ),
} as const;

export const ContainerFull = wrap('section', className.containerFull);
export const ContainerBase = wrap('section', className.containerBase);
export const Container = wrap('section', className.container);
export const Progress = wrap(
  'progress',
  'w-full h-3 bg-gray-200 dark:bg-neutral-700 rounded',
  {
    max: 100,
  }
);

// Need to set explicit role as for list without bullets to be announced as a list
export const Ul = wrap('ul', '', { role: 'list' });

export const H2 = wrap('h2', className.h2);
/* eslint-enable @typescript-eslint/naming-convention */
