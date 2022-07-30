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
  null | undefined
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
    | ((props: Readonly<EXTRA_PROPS> & TagProps<TAG>) => TagProps<TAG>)
) {
  const wrapped = (
    props: Readonly<EXTRA_PROPS> & TagProps<TAG>
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
const buttonClassName = 'button';
const grayButton = `${buttonClassName} hover:bg-gray-400 bg-gray-300 text-gray-800
    dark:bg-neutral-600 dark:text-gray-100 hover:dark:bg-neutral-500`;
const containerBase = `bg-[color:var(--form-foreground)] rounded p-4
  shadow-gray-400 shadow-lg flex flex-col gap-4 overflow-scroll overflow-x-auto
  [overflow-y:overlay] [scrollbar-gutter:stable]`;
const containerFull = 'flex flex-col gap-4 h-full p-4';
const formStyles =
  'text-[length:var(--form-font-size)] font-[family-name:var(--form-font-family)]';
// REFACTOR: reduce this once everything is using React. Can move things into tailwind.config.js
export const className = {
  /*
   * Most fields in Specify are rendered on top of var(--form-background). For
   * some fields that are rendered on top of var(--background), this class
   * name is added to prevent background from clashing
   */
  hasAltBackground: 'has-alt-background',
  /*
   * Do not show validation errors until tried to submit the form or field lost
   * focus
   * These class names are negated so that if you forgot to add it in some
   * place, the validation errors do not get permanently silenced
   */
  notSubmittedForm: 'not-submitted',
  notTouchedInput: 'not-touched',
  // Disable default link click intercept action
  navigationHandled: 'navigation-handled',
  label: 'flex flex-col',
  labelForCheckbox: 'cursor-pointer inline-flex gap-1 items-center',
  textArea: 'max-w-full min-w-[theme(spacing.20)] min-h-[theme(spacing.8)]',
  button: buttonClassName,
  link: 'link',
  icon: 'icon link',
  grayButton,
  niceButton: `${buttonClassName} rounded cursor-pointer active:brightness-80 px-4 py-2
  disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:!bg-neutral-700 gap-2
  inline-flex items-center capitalize`,
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
  containerCenter: `${containerBase} max-w-[min(100%,var(--form-max-width))]
    mx-auto w-full ${formStyles}`,
  formHeader: 'border-b-2 border-brand-300 flex items-center pb-2 gap-4',
  formTitle: 'text-lg font-bold flex items-center gap-2',
  formStyles,
  limitedWidth: `max-w-[min(100%,var(--max-field-width))]`,
  headerPrimary: 'font-semibold text-black dark:text-white',
  headerGray: 'text-gray-500 dark:text-neutral-400',
  // These values must be synchronised with main.css
  dataEntryGrid: 'data-entry-grid',
  formFooter: 'border-brand-300 border-t-2 flex print:hidden pt-2 gap-2',
  dataEntryAdd: '!text-green-700 print:hidden',
  dataEntryView: '!text-orange-400 print:hidden',
  dataEntryEdit: '!text-orange-400 print:hidden',
  dataEntryClone: '!text-amber-700 print:hidden',
  dataEntrySearch: '!text-blue-500 print:hidden',
  dataEntryRemove: '!text-red-700 print:hidden',
  dataEntryVisit: '!text-blue-700 print:hidden',
} as const;
const smallButton = `${className.niceButton} !py-1 !px-2`;
const defaultSmallButtonVariant = `${className.borderedGrayButton} hover:bg-brand-200 dark:hover:bg-brand-400`;

const dataEntryButton = (
  className: string,
  title: string,
  icon: keyof typeof icons
) =>
  function (
    props: Omit<TagProps<'button'>, 'children' | 'type'> & {
      readonly onClick:
        | ((event: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
    }
  ): JSX.Element {
    return (
      <Button.Icon
        className={`${className} ${props.className ?? ''}`}
        icon={icon}
        title={title}
        {...props}
      />
    );
  };

/**
 * Components for Specify Form
 * This is called DataEntry instead of Form because "Form" is already taken
 */
/* eslint-disable @typescript-eslint/naming-convention */
export const DataEntry = {
  Grid: wrap<
    'div',
    {
      readonly viewDefinition: ViewDescription;
      readonly flexibleColumnWidth: boolean;
      readonly display: 'block' | 'inline';
    }
  >(
    'DataEntry.Grid',
    'div',
    `overflow-x-auto items-center p-1 -ml-1 gap-2`,
    ({
      viewDefinition,
      display,
      className: classNameString,
      flexibleColumnWidth,
      style,
      ...props
    }) => ({
      className: `${display === 'inline' ? 'inline-grid' : 'grid'} ${
        classNameString ?? ''
      } ${viewDefinition.columns.length === 1 ? className.limitedWidth : ''}`,
      style: {
        gridTemplateColumns: viewDefinition.columns
          .map((width) =>
            typeof width === 'number'
              ? `${width}${flexibleColumnWidth ? 'fr' : 'px'}`
              : 'auto'
          )
          .join(' '),
        ...style,
      },
      ...props,
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
      readonly colSpan: number;
      readonly align: string;
      readonly visible: boolean;
    }
  >(
    'DataEntry.Cell',
    'div',
    'flex flex-col',
    ({ colSpan, align, visible, ...props }) => ({
      ...props,
      style: {
        visibility: visible ? undefined : 'hidden',
        gridColumn:
          colSpan === 1 ? undefined : `span ${colSpan} / span ${colSpan}`,
        alignItems:
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
    'gap-2 flex font-bold border-b border-gray-500 pt-5 pb-1 items-center',
    ({ children, ...props }) => ({
      // A hack for Safari. See https://github.com/specify/specify7/issues/1535
      children: <span {...props}>{children}</span>,
    })
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
  Remove: dataEntryButton(
    className.dataEntryRemove,
    commonText('remove'),
    'minus'
  ),
  Visit({
    resource,
  }: {
    readonly resource: SpecifyResource<AnySchema> | undefined;
  }): JSX.Element | null {
    return typeof resource === 'object' && !resource.isNew() ? (
      <Link.NewTab
        aria-label={formsText('visit')}
        className={className.dataEntryVisit}
        href={resource.viewUrl()}
        title={formsText('visit')}
      />
    ) : null;
  },
};
export const Label = {
  // REFACTOR: rename this to Block
  Generic: wrap('Label.Generic', 'label', className.label),
  // REFACTOR: rename this to Inline
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
/**
 * Forms are used throughout for accessibility and usability reasons (helps
 * screen readers describe the page, allows for submitting the form with the
 * ENTER key, helps browsers with auto complete)
 */
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
      readonly readOnly?: never;
      readonly isReadOnly?: boolean;
      readonly type?: never;
      // This is used to forbid accidentally passing children
      readonly children?: undefined;
    }
  >(
    'Input.Radio',
    'input',
    className.notTouchedInput,
    ({ isReadOnly, onBlur: handleBlur, ...props }) => ({
      ...props,
      type: 'radio',
      readOnly: isReadOnly,
      // Disable onChange when readOnly
      onChange(event): void {
        if (props.disabled !== true && isReadOnly !== true)
          props.onChange?.(event);
      },
      onBlur(event: React.FocusEvent<HTMLInputElement>): void {
        const input = event.target as HTMLInputElement;
        if (input.classList.contains(className.notTouchedInput))
          Array.from(
            document.body.querySelectorAll(
              `input[type="radio"].${className.notTouchedInput}`
            )
          )
            .filter(
              (target) => (target as HTMLInputElement).name === props.name
            )
            .forEach((input) =>
              input.classList.remove(className.notTouchedInput)
            );
        handleBlur?.(event);
      },
    })
  ),
  Checkbox: wrap<
    'input',
    {
      readonly onValueChange?: (isChecked: boolean) => void;
      readonly readOnly?: never;
      readonly isReadOnly?: boolean;
      readonly type?: never;
      readonly children?: undefined;
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
      readonly onValueChange?: (value: string) => void;
      readonly type?: 'If you need to specify type, use Input.Generic';
      readonly readOnly?: never;
      readonly isReadOnly?: boolean;
      readonly children?: undefined;
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
      readonly onValueChange?: (value: string) => void;
      readonly onDatePaste?: (value: string) => void;
      readonly readOnly?: never;
      readonly isReadOnly?: boolean;
      readonly children?: undefined;
    }
  >(
    'Input.Generic',
    'input',
    `${className.notTouchedInput} w-full`,
    ({
      onValueChange,
      onDatePaste: handleDatePaste,
      isReadOnly,
      ...props
    }) => ({
      ...props,
      ...withHandleBlur(props.onBlur),
      onChange(event): void {
        onValueChange?.((event.target as HTMLInputElement).value);
        props.onChange?.(event);
      },
      onPaste(event): void {
        const target = event.target as HTMLInputElement;
        // Ignore date paste if there is some selected text
        const hasSelectedRegion = target.selectionEnd !== target.selectionStart;
        // Handle pasting dates into input[type="date"] and [type="month"]
        if (typeof handleDatePaste === 'function' && !hasSelectedRegion) {
          const input =
            target.tagName === 'INPUT'
              ? target
              : target.getElementsByTagName('input')[0];
          const initialType = input.type;
          input.type = 'text';
          try {
            const value =
              // @ts-expect-error globalThis.clipboardData does not have typings
              (event.clipboardData ?? globalThis.clipboardData).getData(
                'text/plain'
              );
            handleDatePaste(value);
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
      readonly onValueChange?: (value: number) => void;
      readonly type?: never;
      readonly readOnly?: never;
      readonly isReadOnly?: boolean;
      readonly children?: undefined;
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
    readonly children?: undefined;
    readonly onValueChange?: (value: string) => void;
    readonly readOnly?: never;
    readonly isReadOnly?: boolean;
    readonly autoGrow?: boolean;
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
  `${className.notTouchedInput} w-full pr-5 bg-right cursor-pointer`,
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
     * REFACTOR: don't set event listener if both onValueChange and onValuesChange
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

/**
 * A wrapper for wrap() to generate links that have [href] attribute required
 */
const linkComponent = <EXTRA_PROPS extends IR<unknown> = RR<never, never>>(
  name: string,
  className: string,
  initialProps?:
    | TagProps<'a'>
    | ((props: Readonly<EXTRA_PROPS> & TagProps<'a'>) => TagProps<'a'>)
) =>
  wrap<'a', EXTRA_PROPS & { readonly href: string }>(
    name,
    'a',
    className,
    initialProps
  );

export const Link = {
  Default: linkComponent('Link.Default', className.link),
  NewTab: linkComponent('Link.NewTab', className.link, (props) => ({
    ...props,
    target: '_blank',
    children: (
      <>
        {props.children}
        <span title={commonText('opensInNewTab')}>
          <span className="sr-only">{commonText('opensInNewTab')}</span>
          {icons.externalLink}
        </span>
      </>
    ),
  })),
  Small: linkComponent<{
    /*
     * A class name that is responsible for text and background color
     * Split into a separate prop in order to add a default value
     */
    readonly variant?: string;
  }>(
    'Link.Small',
    smallButton,
    ({
      variant = defaultSmallButtonVariant,
      className: classString,
      ...props
    }) => ({
      className: `${classString ?? ''} ${variant}`,
      ...props,
    })
  ),
  Fancy: linkComponent(
    'Link.Fancy',
    `${className.niceButton} ${className.fancyButton}`
  ),
  Gray: linkComponent(
    'Link.Gray',
    `${className.niceButton} ${className.grayButton}`
  ),
  BorderedGray: linkComponent(
    'Link.BorderedGray',
    `${className.niceButton} ${className.borderedGrayButton}`
  ),
  Red: linkComponent(
    'Link.Red',
    `${className.niceButton} ${className.redButton}`
  ),
  Blue: linkComponent(
    'Link.Blue',
    `${className.niceButton} ${className.blueButton}`
  ),
  Orange: linkComponent(
    'Link.Orange',
    `${className.niceButton} ${className.orangeButton}`
  ),
  Green: linkComponent(
    'Link.Green',
    `${className.niceButton} ${className.greenButton}`
  ),
  Icon: linkComponent<IconProps>(
    'Link.Icon',
    `${className.icon} rounded`,
    ({ icon, ...props }) => ({
      ...props,
      'aria-label': props['aria-label'] ?? props.title,
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
  component: ButtonComponent = Button.Gray,
  ...props
}: Omit<Parameters<typeof Button.Gray>[0], 'onClick'> & {
  readonly component?: typeof Button.Gray;
}): JSX.Element {
  const handleClose = React.useContext(DialogContext);
  if (handleClose === undefined)
    throw new Error("Dialog's handleClose prop is undefined");
  return <ButtonComponent {...props} onClick={handleClose} />;
}

const button = (name: string, className: string) =>
  wrap<
    'button',
    {
      readonly onClick:
        | ((event: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
    }
  >(name, 'button', className, (props) => ({
    ...props,
    type: 'button',
    disabled: props.disabled === true || props.onClick === undefined,
  }));
/*
 * FEATURE: if onClick===undefined, button should be disabled, but only if expicily
 *   provided
 */
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
    }
  >(
    'Button.Small',
    'button',
    smallButton,
    ({
      variant = defaultSmallButtonVariant,
      type,
      className: classString,
      ...props
    }) => ({
      type: 'button',
      className: `${classString ?? ''} ${variant}`,
      ...props,
    })
  ),
  Fancy: button(
    'Button.LikeLink',
    `${className.niceButton} ${className.fancyButton}`
  ),
  Gray: button(
    'Button.Gray',
    `${className.niceButton} ${className.grayButton}`
  ),
  BorderedGray: button(
    'Button.BorderedGray',
    `${className.niceButton} ${className.borderedGrayButton}`
  ),
  Red: button('Button.Red', `${className.niceButton} ${className.redButton}`),
  Blue: button(
    'Button.Blue',
    `${className.niceButton} ${className.blueButton}`
  ),
  Orange: button(
    'Button.Orange',
    `${className.niceButton} ${className.orangeButton}`
  ),
  Green: button(
    'Button.Green',
    `${className.niceButton} ${className.greenButton}`
  ),
  DialogClose: DialogCloseButton,
  Icon: wrap<
    'button',
    IconProps & {
      readonly onClick:
        | ((event: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
    }
  >('Button.Icon', 'button', `${className.icon} rounded`, (props) => ({
    ...props,
    type: 'button',
    children: icons[props.icon],
  })),
} as const;

// Force passing children by nesting rather than through the [value] attribute
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
    `${smallButton} ${defaultSmallButtonVariant}`
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
  'bg-gray-200 border-1 dark:border-none dark:bg-neutral-700 rounded-sm mx-1 p-0.5'
);
