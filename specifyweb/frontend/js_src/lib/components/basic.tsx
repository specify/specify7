/**
 * Primitive React components from which all other components are built
 *
 * These primitive components wrap native DOM elements, while also adding
 * custom styles and in some cases custom logic
 */

import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { split } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { ViewDescription } from '../parseform';
import type { Input as InputType } from '../saveblockers';
import type { IR, RA, RR } from '../types';
import type { IconProps } from './icons';
import { icons } from './icons';

export type RawTagProps<TAG extends keyof React.ReactHTML> = Exclude<
  Parameters<React.ReactHTML[TAG]>[0],
  undefined | null
>;

/**
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

/**
 * Add default className and props to common HTML elements in a type-safe way
 * Essentially function currying, but for React Components
 */
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
  // Would be shown in React DevTools
  name: string,
  tagName: TAG,
  className: string,
  initialProps?:
    | TagProps<TAG>
    | ((props: TagProps<TAG> & Readonly<EXTRA_PROPS>) => TagProps<TAG>)
) {
  const wrapped = (
    props: TagProps<TAG> & Readonly<EXTRA_PROPS>
  ): JSX.Element => {
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
  wrapped.displayName = name;
  return wrapped;
}

/**
 * If dialog contains a button with this className, it will use that icon
 * by default
 */
export const dialogIconTriggers = {
  // Icons are ordered by precedence
  none: '',
  error: 'dialog-icon-error',
  warning: 'dialog-icon-warning',
  success: 'dialog-icon-success',
  info: 'dialog-icon-info',
};

// ClassNames are primarily for usage by non-react components
const niceButton = `rounded cursor-pointer active:brightness-80 px-4 py-2
  disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:!bg-neutral-700 gap-2
  inline-flex items-center capitalize`;
const grayButton = `hover:bg-gray-400 bg-gray-300 text-gray-800
    dark:bg-neutral-600 dark:text-gray-100 hover:dark:bg-neutral-500`;
const containerBase = `bg-[color:var(--form-foreground)] rounded p-4 overflow-y-auto
  shadow-gray-400 shadow-lg flex flex-col gap-4`;
const containerFull = 'flex flex-col gap-4 h-full p-4';
// TODO: reduce this once everything is using React. Can move things into tailwind.config.js
export const className = {
  hasAltBackground: 'has-alt-background',
  // Do not show validation errors until tried to submit the form
  notSubmittedForm: 'not-submitted',
  // Or field lost focus
  notTouchedInput: 'not-touched',
  // Disable default link click intercept action
  navigationHandled: 'navigation-handled',
  label: 'flex flex-col',
  labelForCheckbox: 'cursor-pointer inline-flex gap-x-1 items-center',
  textArea: 'max-w-full min-w-[theme(spacing.20)] min-h-[theme(spacing.8)]',
  button: 'button',
  link: 'link',
  icon: 'icon',
  transparentButton: `hover:bg-gray-300 hover:dark:bg-neutral-500
    text-gray-800 dark:text-neutral-200`,
  grayButton,
  borderedGrayButton: `${grayButton} ring-1 ring-gray-400 dark:ring-0
    disabled:ring-gray-500 disabled:dark:ring-neutral-500`,
  redButton: `${dialogIconTriggers.error} hover:bg-red-800 bg-red-700 text-white`,
  blueButton: `${dialogIconTriggers.info} hover:bg-blue-700 bg-blue-600 text-white`,
  orangeButton: `${dialogIconTriggers.warning} hover:bg-orange-600 bg-orange-500 text-white`,
  greenButton: `${dialogIconTriggers.success} hover:bg-green-800 bg-green-700 text-white`,
  fancyButton: `bg-gray-300 hover:bg-brand-200 dark:bg-neutral-600
    hover:dark:bg-brand:400 text-gray-800 dark:text-white text-center`,
  containerFull,
  containerFullGray: `${containerFull} bg-[color:var(--form-background)]`,
  containerBase,
  containerCenter: `${containerBase} mx-auto max-w-[min(100%,var(--form-max-width))] w-full`,
  formHeader: 'border-b-2 border-brand-300 flex items-center pb-2 gap-x-4',
  formTitle: 'text-lg font-bold',
  headerPrimary: 'font-semibold text-black dark:text-white',
  headerGray: 'text-gray-500 dark:text-neutral-400',
  // These values must be synchronised with main.css
  dataEntryGrid: 'data-entry-grid',
  formFooter: 'border-brand-300 border-t-2 flex print:hidden pt-2 gap-x-2',
  dataEntryAdd: '!text-green-700 print:hidden',
  dataEntryView: '!text-orange-400 print:hidden',
  dataEntryEdit: '!text-orange-400 print:hidden',
  dataEntryClone: '!text-amber-700 print:hidden',
  dataEntrySearch: '!text-blue-500 print:hidden',
  dataEntryDelete: '!text-red-700 print:hidden',
  dataEntryVisit: '!text-blue-700 print:hidden',
} as const;

const dataEntryButton =
  (className: string, title: string, icon: keyof typeof icons) =>
  (
    props: Omit<
      TagProps<'button'>,
      'type' | 'title' | 'aria-label' | 'children'
    >
  ) =>
    (
      <Button.Icon
        className={`${className} ${props.className ?? ''}`}
        title={title}
        aria-label={title}
        icon={icon}
        {...props}
      />
    );

/**
 * Components for Specify Form
 * This is called DataEntry instead of Form because "Form" is already taken
 */
/* eslint-disable @typescript-eslint/naming-convention */
export const DataEntry = {
  Grid: wrap<
    'div',
    {
      viewDefinition: ViewDescription;
    }
  >(
    'DataEntry.Grid',
    'div',
    `grid overflow-x-auto items-center py-5 gap-2 px-1 -ml-1`,
    ({ viewDefinition, ...props }) => ({
      ...props,
      style: {
        gridTemplateColumns: viewDefinition.columns
          .map((width) => (typeof width === 'number' ? `${width}fr` : 'auto'))
          .join(' '),
        ...props.style,
      },
    })
  ),
  Header: wrap('DataEntry.Header', 'header', className.formHeader),
  Title: wrap(
    'DataEntry.Title',
    'h2',
    `${className.headerPrimary} ${className.formTitle}`
  ),
  Cell: wrap<
    'div',
    {
      colSpan: number;
      align: string;
      visible: boolean;
      ariaLabel: string | undefined;
    }
  >(
    'DataEntry.Cell',
    'div',
    'flex flex-col',
    ({ colSpan, align, visible, ariaLabel, ...props }) => ({
      ...props,
      'aria-label': props['aria-label'] ?? ariaLabel,
      style: {
        visibility: visible ? undefined : 'hidden',
        gridColumn:
          colSpan === 1 ? undefined : `span ${colSpan} / span ${colSpan}`,
        justifyContent:
          align === 'right'
            ? 'flex-end'
            : align === 'center'
            ? 'center'
            : undefined,
        ...props.style,
      },
    })
  ),
  Footer: wrap('FormFooter', 'div', className.formFooter, {
    role: 'toolbar',
  }),
  SubForm: wrap('DataEntry.SubForm', 'fieldset', 'contents'),
  SubFormHeader: wrap(
    'DataEntry.SubFormHeader',
    'legend',
    'gap-x-2 flex font-bold border-b border-gray-500 pt-5'
  ),
  SubFormTitle: wrap('DataEntry.SubFormTitle', 'h3', `${className.formTitle}`),
  Add: dataEntryButton(className.dataEntryAdd, commonText('add'), 'plus'),
  View: dataEntryButton(className.dataEntryView, commonText('view'), 'eye'),
  Edit: dataEntryButton(className.dataEntryEdit, commonText('edit'), 'pencil'),
  Clone: dataEntryButton(
    className.dataEntryClone,
    formsText('clone'),
    'clipboard'
  ),
  Search: dataEntryButton(
    className.dataEntrySearch,
    commonText('search'),
    'search'
  ),
  Delete: dataEntryButton(
    className.dataEntryDelete,
    commonText('delete'),
    'minus'
  ),
  Visit({
    resource,
  }: {
    readonly resource: SpecifyResource<AnySchema> | undefined;
  }) {
    return typeof resource === 'object' && !resource.isNew() ? (
      <Link.NewTab
        href={resource.viewUrl()}
        aria-label={formsText('visit')}
        title={formsText('visit')}
        className={className.dataEntryVisit}
      />
    ) : null;
  },
};
export const Label = {
  Generic: wrap('Label.Generic', 'label', className.label),
  ForCheckbox: wrap('Label.ForCheckbox', 'label', className.labelForCheckbox),
};
export const ErrorMessage = wrap(
  'ErrorMessage',
  'div',
  'flex flex-col gap-2 p-2 text-white bg-red-500 rounded',
  {
    role: 'alert',
  }
);
export const Form = wrap(
  'Form',
  'form',
  `${className.notSubmittedForm} flex flex-col gap-4`,
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
      if (typeof props?.onSubmit === 'function') {
        /*
         * If container has a <form>, and it summons a dialog (which uses a React
         * Portal) which renders another <form>, the child <form>, while not be
         * in the same DOM hierarchy, but would still have its onSubmit event
         * bubble (because React Portals resolve event bubbles).
         * Thus, have to stop propagation
         */
        event.stopPropagation();
        // Prevent default just so that I don't have to do it in the callback
        event.preventDefault();
        props.onSubmit(event);
      }
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
  Radio: wrap<
    'input',
    {
      readOnly?: never;
      isReadOnly?: boolean;
      type?: never;
      // This is used to forbid accidentally passing children
      children?: undefined;
    }
  >('Input.Radio', 'input', '', ({ isReadOnly, ...props }) => ({
    ...props,
    type: 'radio',
    readOnly: isReadOnly,
    // Disable onChange when readOnly
    onChange(event): void {
      if (props.disabled !== true || isReadOnly === true)
        props.onChange?.(event);
    },
  })),
  Checkbox: wrap<
    'input',
    {
      onValueChange?: (isChecked: boolean) => void;
      readOnly?: never;
      isReadOnly?: boolean;
      type?: never;
      children?: undefined;
    }
  >(
    'Input.Checkbox',
    'input',
    `${className.notTouchedInput} rounded-xs`,
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      type: 'checkbox',
      onChange(event): void {
        // Disable onChange when readOnly
        if (props.disabled === true || isReadOnly === true) return;
        onValueChange?.((event.target as HTMLInputElement).checked);
        props.onChange?.(event);
      },
      readOnly: isReadOnly,
    })
  ),
  Text: wrap<
    'input',
    {
      onValueChange?: (value: string) => void;
      type?: 'If you need to specify type, use Input.Generic';
      readOnly?: never;
      isReadOnly?: boolean;
      children?: undefined;
    }
  >(
    'Input.Text',
    'input',
    `${className.notTouchedInput} w-full`,
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      type: 'text',
      ...withHandleBlur(props.onBlur),
      onChange(event): void {
        onValueChange?.((event.target as HTMLInputElement).value);
        props.onChange?.(event);
      },
      readOnly: isReadOnly,
    })
  ),
  Generic: wrap<
    'input',
    {
      onValueChange?: (value: string) => void;
      readOnly?: never;
      isReadOnly?: boolean;
      children?: undefined;
    }
  >(
    'Input.Generic',
    'input',
    `${className.notTouchedInput} w-full`,
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      ...withHandleBlur(props.onBlur),
      onChange(event): void {
        onValueChange?.((event.target as HTMLInputElement).value);
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
            if (typeof onValueChange === 'function') onValueChange(input.value);
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
      readOnly: isReadOnly,
    })
  ),
  Number: wrap<
    'input',
    {
      onValueChange?: (value: number) => void;
      type?: never;
      readOnly?: never;
      isReadOnly?: boolean;
      children?: undefined;
    }
  >(
    'Input.Number',
    'input',
    `${className.notTouchedInput} w-full`,
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      type: 'number',
      ...withHandleBlur(props.onBlur),
      onChange(event): void {
        onValueChange?.(
          Number.parseInt((event.target as HTMLInputElement).value)
        );
        props.onChange?.(event);
      },
      readOnly: isReadOnly,
    })
  ),
};
export const Textarea = wrap<
  'textarea',
  {
    children?: undefined;
    onValueChange?: (value: string) => void;
    readOnly?: never;
    isReadOnly?: boolean;
    autoGrow?: boolean;
  }
>(
  'Textarea',
  'textarea',
  // Ensures Textarea can't grow past max dialog width
  `${className.notTouchedInput} ${className.textArea}`,
  ({ onValueChange, isReadOnly, ...props }) => ({
    ...props,
    ...withHandleBlur(props.onBlur),
    onChange(event): void {
      onValueChange?.((event.target as HTMLTextAreaElement).value);
      props.onChange?.(event);
    },
    readOnly: isReadOnly,
  })
);
export const selectMultipleSize = 4;
export const Select = wrap<
  'select',
  {
    readonly onValueChange?: (value: string) => void;
    readonly onValuesChange?: (value: RA<string>) => void;
  }
>(
  'Select',
  'select',
  `${className.notTouchedInput} w-full`,
  ({ onValueChange, onValuesChange, ...props }) => ({
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
    /*
     * TODO: don't set event listener if both onValueChange and onValuesChange
     *   are undefined
     */
    onChange(event): void {
      const options = Array.from(
        (event.target as HTMLSelectElement).querySelectorAll('option')
      );
      const [unselected, selected] = split(options, ({ selected }) => selected);
      /*
       * Selected options in an optional multiple select are clashing with
       * the background both in dark-mode. This is a fix:
       */
      if (props.required !== true && props.multiple === true) {
        selected.map((option) => option.classList.add('dark:bg-neutral-100'));
        unselected.map((option) =>
          option.classList.remove('dark:bg-neutral-100')
        );
      }
      const value = (event.target as HTMLSelectElement).value;

      /*
       * Workaround for Safari weirdness. See more:
       * https://github.com/specify/specify7/issues/1371#issuecomment-1115156978
       */
      if (typeof props.size !== 'number' || props.size < 2 || value !== '')
        onValueChange?.(value);
      onValuesChange?.(selected.map(({ value }) => value));
      props.onChange?.(event);
    },
  })
);

export const Link = {
  Default: wrap('Link.Default', 'a', className.link),
  NewTab: wrap('Link.NewTab', 'a', className.link, (props) => ({
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
  LikeButton: wrap('Link.LikeButton', 'a', className.button),
  Fancy: wrap(
    'Link.Transparent',
    'a',
    `${niceButton} ${className.fancyButton}`
  ),
  Transparent: wrap(
    'Link.Transparent',
    'a',
    `${niceButton} ${className.transparentButton}`
  ),
  Gray: wrap('Link.Gray', 'a', `${niceButton} ${className.grayButton}`),
  BorderedGray: wrap(
    'Link.BorderedGray',
    'a',
    `${niceButton} ${className.borderedGrayButton}`
  ),
  Red: wrap('Link.Red', 'a', `${niceButton} ${className.redButton}`),
  Blue: wrap('Link.Blue', 'a', `${niceButton} ${className.blueButton}`),
  Orange: wrap('Link.Orange', 'a', `${niceButton} ${className.orangeButton}`),
  Green: wrap('Link.Green', 'a', `${niceButton} ${className.greenButton}`),

  Icon: wrap<'a', IconProps>(
    'Link.Icon',
    'a',
    `${className.icon} rounded`,
    ({ icon, ...props }) => ({
      ...props,
      children: icons[icon],
    })
  ),
} as const;

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

const button = (name: string, className: string) =>
  wrap(name, 'button', className, {
    type: 'button',
  });
export const Button = {
  Simple: button('Button.Simple', className.button),
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
    `${niceButton} !py-1 !px-2`,
    ({
      variant = `${className.borderedGrayButton} hover:bg-brand-200 dark:hover:bg-brand-400`,
      type,
      className: classString,
      ...props
    }) => ({
      type: 'button',
      className: `${classString} ${variant}`,
      ...props,
    })
  ),
  Fancy: button('Button.LikeLink', `${niceButton} ${className.fancyButton}`),
  Transparent: button(
    'Button.Transparent',
    `${niceButton} ${className.transparentButton}`
  ),
  Gray: button('Button.Gray', `${niceButton} ${className.grayButton}`),
  BorderedGray: button(
    'Button.BorderedGray',
    `${niceButton} ${className.borderedGrayButton}`
  ),
  Red: button('Button.Red', `${niceButton} ${className.redButton}`),
  Blue: button('Button.Blue', `${niceButton} ${className.blueButton}`),
  Orange: button('Button.Orange', `${niceButton} ${className.orangeButton}`),
  Green: button('Button.Green', `${niceButton} ${className.greenButton}`),
  DialogClose: DialogCloseButton,
  Icon: wrap<'button', IconProps>(
    'Button.Icon',
    'button',
    `${className.icon} rounded`,
    (props) => ({
      ...props,
      type: 'button',
      children: icons[props.icon],
    })
  ),
} as const;

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
    }: TagProps<'input'> & SubmitProps): TagProps<'input'> => ({
      type: 'submit',
      ...props,
      value: children,
    })
  );
export const Submit = {
  // Force passing children by nesting rather than through the [value] attribute
  Simple: submitButton('Submit.Simple', className.button),
  Fancy: submitButton(
    'Submit.Fancy',
    `${niceButton} ${className.fancyButton} !inline`
  ),
  Transparent: submitButton(
    'Submit.Transparent',
    `${niceButton} ${className.transparentButton}`
  ),
  Gray: submitButton('Submit.Gray', `${niceButton} ${className.grayButton}`),
  Red: submitButton('Submit.Red', `${niceButton} ${className.redButton}`),
  Blue: submitButton('Submit.Blue', `${niceButton} ${className.blueButton}`),
  Orange: submitButton(
    'Submit.Orange',
    `${niceButton} ${className.orangeButton}`
  ),
  Green: submitButton('Submit.Green', `${niceButton} ${className.greenButton}`),
} as const;

export const Container = {
  /**
   * Full-screen gray container. Ment to be a wrapper for Container.Base
   */
  FullGray: wrap('Container.FullGray', 'div', className.containerFullGray),
  /**
   * Limited width white container. Ment to be wrapped inside Container.FullGray
   * Commonly used as an <aside> to main content
   */
  Base: wrap('Container.Base', 'section', className.containerBase),
  /**
   * Limited width white container. Ment to be wrapped inside Container.FullGray
   */
  Center: wrap('Container.Center', 'section', className.containerCenter),

  /**
   * Full-screen white container. Ment to be a wrapper for full width content
   */
  Full: wrap('Container.Full', 'section', className.containerFull),
};
export const Progress = wrap<'progress', { readonly value: number }>(
  'Progress',
  'progress',
  'w-full h-3 bg-gray-200 dark:bg-neutral-700 rounded',
  {
    max: 100,
  }
);

// Need to set explicit [role] for list without bullets to be announced as a list
export const Ul = wrap('Ul', 'ul', '', { role: 'list' });

export const H2 = wrap('H2', 'h2', className.headerPrimary);
export const H3 = wrap('H3', 'h3', className.headerGray);
/* eslint-enable @typescript-eslint/naming-convention */

export const Summary = wrap<
  'summary',
  { readonly onToggle: (isCollapsed: boolean) => void }
>('Summary', 'summary', '', ({ onToggle: handleToggle, ...props }) => ({
  ...props,
  onClick:
    typeof props.onClick === 'function' || typeof handleToggle === 'function'
      ? (event): void => {
          /*
           * This is needed to prevent browser from handling state change
           * See: https://github.com/facebook/react/issues/15486
           */
          event.preventDefault();
          props.onClick?.(event);
          const details = (event.target as Element)?.closest('details');
          if (details === null)
            throw new Error("Can't use <summary> outside of <details>");
          handleToggle?.(!details.hasAttribute('open'));
        }
      : undefined,
}));

export const Key = wrap(
  'Key',
  'kbd',
  'bg-gray-200 border-1 dark:border-none dark:bg-neutral-700 rounded-sm p-0.5'
);
