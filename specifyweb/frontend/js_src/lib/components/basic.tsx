import type { ReactHTML } from 'react';
import React from 'react';

import commonText from '../localization/common';
import { capitalize } from '../wbplanviewhelper';

type TagProps<TAG extends keyof ReactHTML> = Exclude<
  Parameters<ReactHTML[TAG]>[0],
  undefined | null
>;

// Add default className and props to common HTML elements in a type-safe way
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-params
function wrap<TAG extends keyof ReactHTML>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TagName: TAG,
  className: string,
  initialProps?: TagProps<TAG>,
  // Define props merge behaviour
  mergeProps: (props: TagProps<TAG>) => TagProps<TAG> = (
    props
  ): TagProps<TAG> => ({
    ...initialProps,
    ...props,
  })
) {
  /*
   * The component is wrapped in React.forwardRef to allow forwarding ref
   * See: https://reactjs.org/docs/forwarding-refs.html
   */
  const wrapped = React.forwardRef((props: TagProps<TAG>, ref): JSX.Element => {
    // Merge classNames
    const fullClassName =
      typeof props?.className === 'string'
        ? `${className} ${props.className}`
        : className;
    const { children, ...mergedProps } = mergeProps(props);
    return (
      // @ts-expect-error
      <TagName {...mergedProps} ref={ref} className={fullClassName}>
        {children}
      </TagName>
    );
  });
  // Use capitalized tagName as a devTool's component name
  wrapped.displayName = capitalize(TagName);
  return wrapped;
}

// For usage by non-react components
export const className = {
  root: 'flex flex-col h-screen overflow-hidden text-neutral-900',
  label: 'flex flex-col',
  labelForCheckbox: 'cursor-pointer flex gap-x-1 items-center',
  checkboxGroup: 'flex flex-col gap-2 max-h-56 overflow-y-auto pl-1 -ml-1',
  radio: 'h-3 w-3',
  checkbox: 'h-3 w-3',
  errorMessage: 'flex gap-2 p-2 text-white bg-red-500 rounded',
  notSubmittedForm: 'not-submitted',
  notTouchedInput: 'not-touched',
  form: 'flex flex-col gap-4',
  button: 'button',
  link: 'link',
  fancyButton: `active:bg-brand-300 bg-gray-300 gap-2 hover:bg-brand-200 inline-flex
    justify-center items-center p-2 text-black`,
  containerFull: 'flex flex-col gap-4 h-full',
  container: `bg-gray-200 flex flex-col gap-y-2 max-w-[1000px] mx-auto p-4
    shadow-[0_3px_5px_-1px]`,
  formHeader: `specify-form-header border-b-2 border-brand-300 flex items-center
    pb-2 gap-x-4`,
  formTitle: 'view-title flex-1 text-lg',
  formLabel: 'specify-form-label text-right',
  formFooter:
    'specify-form-buttons border-brand-300 border-t-2 flex print:hidden pt-2 gap-x-2',
};

/* eslint-disable @typescript-eslint/naming-convention */
export const Label = wrap('label', className.label);
export const LabelForCheckbox = wrap('label', className.labelForCheckbox);
export const CheckboxGroup = wrap('div', className.checkboxGroup);
export const Radio = wrap('input', className.radio, { type: 'radio' });
export const Checkbox = wrap('input', className.checkbox, { type: 'checkbox' });
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
export const Link = wrap('a', className.link);
export const NewTabLink = wrap('a', className.link, {}, (props) => ({
  target: '_blank',
  children: (
    <>
      {props.children}
      <img
        src="/static/img/new_tab.svg"
        alt={commonText('opensInNewTab')}
        aria-label={commonText('opensInNewTab')}
        title={commonText('opensInNewTab')}
        className="h-2"
      />
    </>
  ),
}));
export const LinkLikeButton = wrap('a', className.button);
export const ButtonLikeLink = wrap('button', className.link, {
  type: 'button',
});
export const Submit = wrap('input', className.button, {
  type: 'submit',
});
export const FancySubmit = wrap('input', className.fancyButton, {
  type: 'submit',
});
export const Button = wrap('button', className.button, {
  type: 'button',
});
export const ContainerFull = wrap('section', className.containerFull);
/* eslint-enable @typescript-eslint/naming-convention */
