import type React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { dayjs } from '../../utils/dayJs';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import { fullDateFormat } from '../../utils/parser/dateFormat';
import { parseDate } from '../../utils/parser/dayJsFixes';
import { parseAnyDate } from '../../utils/relativeDate';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { split } from '../../utils/utils';
import { error } from '../Errors/assert';
import type { Input as InputType } from '../Forms/validationHelpers';
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
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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

/**
 * Prevent scroll wheel accidentally changing input value.
 *
 * See https://stackoverflow.com/a/69497807/8584605
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const withPreventWheel = <TYPE extends InputType>(
  handleWheel: ((event: React.WheelEvent<TYPE>) => void) | undefined
) => ({
  onWheel(event: React.WheelEvent<TYPE>): void {
    const target = event.target as TYPE;

    if (target.type === 'number') {
      target.blur();
      setTimeout(() => target.focus(), 0);
    }

    handleWheel?.(event);
  },
});

export const Input = {
  Radio: wrap<
    'input',
    {
      readonly readOnly?: 'Use isReadOnly instead';
      readonly isReadOnly?: boolean;
      readonly type?: 'If you need to specify type, use Input.Generic';
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
      readonly onClick?: 'Use onValueChange instead';
      readonly readOnly?: 'Use isReadOnly instead';
      readonly isReadOnly?: boolean;
      readonly type?: 'If you need to specify type, use Input.Generic';
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
      readonly onValueChange?: (value: LocalizedString) => void;
      readonly type?: 'If you need to specify type, use Input.Generic';
      readonly readOnly?: 'Use isReadOnly instead';
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
        onValueChange?.(localized((event.target as HTMLInputElement).value));
        props.onChange?.(event);
      },
      readOnly: isReadOnly,
    })
  ),
  Generic: wrap<
    'input',
    {
      readonly onValueChange?: (value: LocalizedString) => void;
      readonly onDatePaste?: (value: LocalizedString) => void;
      readonly readOnly?: 'Use isReadOnly instead';
      readonly isReadOnly?: boolean;
      readonly children?: undefined;
    }
  >(
    'Input.Generic',
    'input',
    `${className.notTouchedInput} w-full`,
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      ...withHandleBlur(props.onBlur),
      onChange(event): void {
        onValueChange?.(localized((event.target as HTMLInputElement).value));
        props.onChange?.(event);
      },
      onDoubleClick(event): void {
        const input = event.target as HTMLInputElement;
        if (input.type === 'date' && !input.readOnly) {
          input.type = 'text';
          const parsed = parseDate('full', input.value);
          if (parsed.isValid()) input.value = parsed.format(fullDateFormat());
        }
        props.onDoubleClick?.(event);
      },
      onBlur(event): void {
        const input = event.target as HTMLInputElement;
        if (props.type === 'date' && input.type !== 'date') {
          const relativeDate = parseAnyDate(input.value);
          if (relativeDate !== undefined) {
            const parsed = dayjs(relativeDate);
            if (parsed.isValid())
              input.value = parsed.format(databaseDateFormat);
          }
          input.type = 'date';
        }
        withHandleBlur(props.onBlur).onBlur(event);
      },
      ...withPreventWheel(props.onWheel),
      readOnly: isReadOnly,
    })
  ),
  Integer: wrap<
    'input',
    {
      readonly onValueChange?: (value: number) => void;
      readonly type?: 'If you need to specify type, use Input.Generic';
      readonly readOnly?: 'Use isReadOnly instead';
      readonly isReadOnly?: boolean;
      readonly children?: undefined;
    }
  >(
    'Input.Integer',
    'input',
    `${className.notTouchedInput} w-full`,
    ({ onValueChange, isReadOnly, ...props }) =>
      process.env.NODE_ENV === 'development' &&
      typeof props.step === 'number' &&
      props.step !== Math.floor(props.step)
        ? error('If step <1 is needed, use Input.Float instead')
        : {
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
          }
  ),
  Float: wrap<
    'input',
    {
      readonly onValueChange?: (value: number) => void;
      readonly type?: never;
      readonly readOnly?: never;
      readonly isReadOnly?: boolean;
      readonly children?: undefined;
      readonly step?: number | 'any';
    }
  >(
    'Input.Float',
    'input',
    `${className.notTouchedInput} w-full`,
    ({ onValueChange, isReadOnly, ...props }) => ({
      ...props,
      type: 'number',
      ...withHandleBlur(props.onBlur),
      onChange(event): void {
        onValueChange?.(
          Number.parseFloat((event.target as HTMLInputElement).value)
        );
        props.onChange?.(event);
      },
      step: props.step ?? 'any',
      ...withPreventWheel(props.onWheel),
      readOnly: isReadOnly,
    })
  ),
};
export const Textarea = wrap<
  'textarea',
  {
    readonly children?: undefined;
    readonly onValueChange?: (value: LocalizedString) => void;
    readonly readOnly?: 'Use isReadOnly instead';
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
    type: undefined,
    ...withHandleBlur(props.onBlur),
    onChange(event): void {
      onValueChange?.(localized((event.target as HTMLTextAreaElement).value));
      props.onChange?.(event);
    },
    readOnly: isReadOnly,
  })
);
export const selectMultipleSize = 4;
export const Select = wrap<
  'select',
  {
    readonly onValueChange?: (value: LocalizedString) => void;
    readonly onValuesChange?: (value: RA<LocalizedString>) => void;
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
      const options = Array.from(event.target.options);
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
        onValueChange?.(localized(value));
      onValuesChange?.(selected.map(({ value }) => localized(value)));
      props.onChange?.(event);
    },
  })
);
