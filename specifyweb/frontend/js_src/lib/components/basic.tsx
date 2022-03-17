import React from 'react';

import { error } from '../assert';
import commonText from '../localization/common';
import type { Input as InputType } from '../saveblockers';
import type { IR, RR } from '../types';
import { capitalize } from '../wbplanviewhelper';
import type { IconProps } from './icons';
import { icons } from './icons';

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
      ? initialProps({ ...props, className: fullClassName })
      : { ...initialProps, ...props, className: fullClassName };
    return React.createElement(tagName, {
      ...mergedProps,
      ref: forwardRef,
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

/*
 * TODO: make a react hook that listens for updates
 * TODO: allow overwriting this in the UI
 */
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
const subViewHeader = 'specify-subview-header';
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
  // TODO: get rid of usages of this:
  subViewHeader,
  subFormHeader: `${subViewHeader} gap-x-2 flex font-bold border-b border-gray-500`,
  queryField: `bg-white dark:bg-neutral-700 border border-gray-300 p-2 shadow
    flex gap-x-2 rounded dark:border-none`,
  h2: 'font-semibold text-black dark:text-white',
  // Disable default link click intercept action
  navigationHandled: 'navigation-handled',
} as const;

/* eslint-disable @typescript-eslint/naming-convention */
export const Label = {
  Generic: wrap('label', className.label),
  ForCheckbox: wrap('label', className.labelForCheckbox),
};
export const ErrorMessage = wrap('div', className.errorMessage, {
  role: 'alert',
});
export const FormFooter = wrap('div', className.formFooter, {
  role: 'toolbar',
});
export const FormHeader = wrap('h2', className.formHeader);
export const SubFormHeader = wrap('div', className.subFormHeader);
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
      /*
       * If container has a <form>, and it summons a dialog (with uses a React
       * Portal) which renders anoter <form>, the child <form>, while not being
       * in the same DOM hierarchy, would still have it's onSubmit event bubble
       * (because React Portals resolve event bubbles).
       */
      if (typeof props?.onSubmit === 'function') event.stopPropagation();
      props?.onSubmit?.(event);
    },
  })
);
/*
 * Don't highlight missing required and pattern mismatch fields until focus
 * loss
 */
const withHandleBlur = <TYPE extends InputType>(
  handleBlur: ((event: React.FocusEvent<TYPE>) => void) | undefined
) => ({
  onBlur(event: React.FocusEvent<TYPE>): void {
    const input = event.target as TYPE;
    if (input.classList.contains(className.notTouchedInput))
      input.classList.remove(className.notTouchedInput);
    handleBlur?.(event);
  },
});
export const Input = {
  Radio: wrap('input', className.radio, { type: 'radio' }),
  Checkbox: wrap<
    'input',
    {
      onValueChange?: (isChecked: boolean) => void;
    }
  >('input', className.checkbox, (props) => ({
    ...props,
    onChange(event): void {
      props.onValueChange?.((event.target as HTMLInputElement).checked);
      props.onChange?.(event);
    },
  })),
  Text: wrap<
    'input',
    {
      readonly onValueChange?: (value: string) => void;
      readonly type?: 'If you need to specify type, use Input.Generic';
    }
  >('input', className.notTouchedInput, (props) => ({
    ...props,
    type: 'text',
    ...withHandleBlur(props.onBlur),
    onChange(event): void {
      props.onValueChange?.((event.target as HTMLInputElement).value);
      props.onChange?.(event);
    },
  })),
  Generic: wrap<
    'input',
    {
      readonly onValueChange?: (value: string) => void;
    }
  >('input', className.notTouchedInput, (props) => ({
    ...props,
    ...withHandleBlur(props.onBlur),
    onChange(event): void {
      props.onValueChange?.((event.target as HTMLInputElement).value);
      props.onChange?.(event);
    },
    onPaste(event): void {
      const target = event.target as HTMLInputElement;
      // Handle pasting dates into input[type="date"]
      if (target.type === 'date') {
        const input =
          target.tagName === 'INPUT'
            ? target
            : target.getElementsByTagName('input')[0];
        const initialType = input.type;
        input.type = 'text';
        try {
          // @ts-expect-error
          input.value = (event.clipboardData ?? window.clipboardData).getData(
            'text/plain'
          );
          if (typeof props.onValueChange === 'function')
            props.onValueChange(input.value);
          else if (typeof props.onChange === 'function')
            props.onChange(
              event as unknown as React.ChangeEvent<HTMLInputElement>
            );
          else
            console.error('Input does not have an onChange event listener', {
              event,
            });
        } catch (error: unknown) {
          console.error(error);
        }

        event.preventDefault();
        input.type = initialType;
      }
      props.onPaste?.(event);
    },
  })),
  Number: wrap<
    'input',
    {
      readonly onValueChange?: (value: number) => void;
      readonly type?: never;
    }
  >('input', className.notTouchedInput, (props) => ({
    ...props,
    type: 'number',
    ...withHandleBlur(props.onBlur),
    onChange(event): void {
      props.onValueChange?.(
        Number.parseInt((event.target as HTMLInputElement).value)
      );
      props.onChange?.(event);
    },
  })),
};
export const Textarea = wrap<
  'textarea',
  {
    readonly children?: undefined;
    readonly onValueChange?: (value: string) => void;
  }
>(
  'textarea',
  `${className.notTouchedInput} ${className.textarea}`,
  (props) => ({
    ...props,
    ...withHandleBlur(props.onBlur),
    onChange(event): void {
      props.onValueChange?.((event.target as HTMLTextAreaElement).value);
      props.onChange?.(event);
    },
  })
);
export const Select = wrap('select', className.notTouchedInput, (props) => ({
  ...props,
  /*
   * Required fields have blue background. Selected <option> in a select
   * multiple also has blue background. Those clash. Need to make required
   * select background slightly lighter
   */
  className: `${props.className ?? ''}${
    props.required === true &&
    (props.multiple === true ||
      (typeof props.size === 'number' && props.size > 1))
      ? ' bg-blue-100 dark:bg-blue-900'
      : ''
  }`,
  ...withHandleBlur(props.onBlur),
}));

export const Link = {
  Default: wrap('a', className.link),
  NewTab: wrap('a', className.link, (props) => ({
    ...props,
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

export const DialogContext = React.createContext<(() => void) | undefined>(() =>
  error('DialogContext can only be used by <Dialog> buttons')
);
DialogContext.displayName = 'DialogContext';

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

const button = (className: string) =>
  wrap('button', className, {
    type: 'button',
  });
export const Button = {
  Simple: button(className.button),
  /*
   * When using Button.LikeLink component, consider adding [role="link"] if the
   * element should be announced as a link
   */
  LikeLink: button(className.link),
  Transparent: button(`${niceButton} ${className.transparentButton}`),
  Gray: button(`${niceButton} ${className.grayButton}`),
  Red: button(`${niceButton} ${className.redButton}`),
  Blue: button(`${niceButton} ${className.blueButton}`),
  Orange: button(`${niceButton} ${className.orangeButton}`),
  Green: button(`${niceButton} ${className.greenButton}`),
  DialogClose: DialogCloseButton,
  Icon: wrap<'button', IconProps>('button', className.link, (props) => ({
    ...props,
    type: 'button',
    children: icons[props.icon],
  })),
} as const;

type SubmitProps = {
  readonly children: string;
  readonly value?: undefined;
};
const submitButton = (buttonClassName: string) =>
  wrap<'input', SubmitProps>(
    'input',
    buttonClassName,
    ({
      children,
      ...props
    }: TagProps<'input'> & SubmitProps): TagProps<'input'> => ({
      type: 'submit',
      ...props,
      value: children,
      onClick(event): void {
        (event.target as HTMLInputElement)
          .closest('form')
          ?.classList.remove(className.notSubmittedForm);
        props.onClick?.(event);
      },
    })
  );
export const Submit = {
  // Force passing children by nesting rather than through the [value] attribute
  Simple: submitButton(className.button),
  Fancy: submitButton(className.fancyButton),
  Transparent: submitButton(`${niceButton} ${className.transparentButton}`),
  Gray: submitButton(`${niceButton} ${className.grayButton}`),
  Red: submitButton(`${niceButton} ${className.redButton}`),
  Blue: submitButton(`${niceButton} ${className.blueButton}`),
  Orange: submitButton(`${niceButton} ${className.orangeButton}`),
  Green: submitButton(`${niceButton} ${className.greenButton}`),
} as const;

export const Container = {
  Generic: wrap('section', className.container),
  Full: wrap('section', className.containerFull),
  Base: wrap('section', className.containerBase),
};
export const Progress = wrap<'progress', { readonly value: number }>(
  'progress',
  'w-full h-3 bg-gray-200 dark:bg-neutral-700 rounded',
  {
    max: 100,
  }
);

// Need to set explicit [role] for list without bullets to be announced as a list
export const Ul = wrap('ul', '', { role: 'list' });

export const H2 = wrap('h2', className.h2);
/* eslint-enable @typescript-eslint/naming-convention */
