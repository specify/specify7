import type React from 'react';

import type { RA } from '../../utils/types';
import { split } from '../../utils/utils';
import type { Input as InputType } from '../DataModel/saveBlockers';
import { softFail } from '../Errors/Crash';
import { className } from './className';
import { wrap } from './wrapper';

export const Label = {
  Block: wrap('Label.Block', 'label', className.label),
  Inline: wrap('Label.Inline', 'label', className.labelForCheckbox),
};
/**
 * Forms are used throughout for accessibility and usability reasons (helps
 * screen readers describe the page, allows for submitting the form with the
 * ENTER key, helps browsers with auto complete)
 */
export const Form = wrap(
  'Form',
  'form',
  `${className.notSubmittedForm} flex flex-col gap-4 min-h-[30vh]`,
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
export const withHandleBlur = <TYPE extends InputType>(
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
        if (
          input.classList.contains(className.notTouchedInput) &&
          typeof props.name === 'string'
        )
          Array.from(
            document.body.querySelectorAll(
              `input[type="radio"][name="${props.name}"].${className.notTouchedInput}`
            )
          ).forEach((input) =>
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
            softFail(error);
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
  `${className.notTouchedInput} w-full pr-5 bg-right cursor-pointer min-w-[theme(spacing.40)]`,
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
       * the background in dark-mode. This is a fix:
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
