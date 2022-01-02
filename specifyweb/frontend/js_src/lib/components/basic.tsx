import type { ReactHTML } from 'react';
import React from 'react';

import { capitalize } from '../wbplanviewhelper';

// Add default className and props to common HTML elements in a type-safe way
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-params
function wrap<TAG extends keyof ReactHTML>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TagName: TAG,
  className: string,
  initialProps?: Parameters<ReactHTML[TAG]>[0],
  // Define props merge behaviour
  mergeProps: (
    props: Parameters<ReactHTML[TAG]>[0]
  ) => Parameters<ReactHTML[TAG]>[0] = (
    props
  ): Parameters<ReactHTML[TAG]>[0] => ({
    ...initialProps,
    ...props,
  })
) {
  /*
   * The component is wrapped in React.forwardRef to allow forwarding ref
   * See: https://reactjs.org/docs/forwarding-refs.html
   */
  const wrapped = React.forwardRef(
    (props: Parameters<ReactHTML[TAG]>[0], ref): JSX.Element => {
      // Merge classNames
      const fullClassName =
        typeof props?.className === 'string'
          ? `${className} ${props.className}`
          : className;
      return (
        // @ts-expect-error
        <TagName {...mergeProps(props)} ref={ref} className={fullClassName}>
          {props?.children}
        </TagName>
      );
    }
  );
  // Use capitalized tagName as a devTool's component name
  wrapped.displayName = capitalize(TagName);
  return wrapped;
}

// For usage by non-react components
export const className = {
  root: 'flex flex-col h-screen overflow-hidden text-neutral-900',
  label: 'flex flex-col cursor-pointer',
  labelForCheckbox: 'cursor-pointer flex gap-x-1 items-center',
  checkboxGroup: 'flex flex-col gap-2 max-h-56 overflow-y-auto pl-1 -ml-1',
  radio: 'h-3 w-3',
  errorMessage: 'flex gap-2 p-2 text-white bg-red-500 rounded',
  notSubmittedForm: 'not-submitted',
  notTouchedInput: 'not-touched',
  form: 'flex flex-col gap-4',
  buttonWide: 'active:bg-brand-300 hover:bg-brand-200 p-2 bg-gray-300',
};

/* eslint-disable @typescript-eslint/naming-convention */
export const Label = wrap('label', className.label);
export const LabelForCheckbox = wrap('label', className.labelForCheckbox);
export const CheckboxGroup = wrap('div', className.checkboxGroup);
export const Radio = wrap('input', className.radio, { type: 'radio' });
export const ErrorMessage = wrap('div', className.errorMessage, {
  role: 'alert',
});
export const Form = wrap(
  'form',
  `${className.notSubmittedForm} ${className.form}`,
  {},
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
export const Input = wrap('input', className.notTouchedInput, {}, (props) => ({
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
export const TextArea = wrap(
  'textarea',
  className.notTouchedInput,
  {},
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
export const Select = wrap(
  'select',
  className.notTouchedInput,
  {},
  (props) => ({
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
  })
);
export const SubmitWide = wrap('input', className.buttonWide, {
  type: 'submit',
});
/* eslint-enable @typescript-eslint/naming-convention */
