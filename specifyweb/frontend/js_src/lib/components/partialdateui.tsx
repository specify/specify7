import React from 'react';

import type { AnySchema } from '../datamodelutils';
import {
  accessibleDatePickerEnabled,
  accessibleMonthPickerEnabled,
  databaseDateFormat,
  fullDateFormat,
  monthFormat,
} from '../dateformat';
import { dayjs, getDateInputValue } from '../dayjs';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { RR } from '../types';
import { defined } from '../types';
import { getValidationAttributes, resolveParser } from '../uiparse';
import { UiPlugin } from '../uiplugin';
import { Button, Input, Select } from './basic';
import { useValidation } from './hooks';
import { dateParts } from './internationalization';
import createBackboneView from './reactbackboneextend';
import { useSaveBlockers } from './resource';

function isInputSupported(type: string): boolean {
  const input = document.createElement('input');
  const value = 'a';
  input.setAttribute('type', type);
  input.setAttribute('value', value);
  return input.value !== value;
}

/*
 * If input[type="date"] or input[type="month"] is not supported,
 * present the date in a more human readable format
 */

const inputTypeYearAttributes = getValidationAttributes(
  defined(resolveParser({}, { type: 'year' }))
);

const precisions = { full: 1, 'month-year': 2, year: 3 } as const;
const reversePrecision: RR<number, PartialDatePrecision> = {
  1: 'full',
  2: 'month-year',
  3: 'year',
};
export type PartialDatePrecision = keyof typeof precisions;

// These may be reassigned after remotePrefs are loaded:
let dateType = 'date';
let monthType = 'month';
let dateSupported = isInputSupported('date');
let monthSupported = isInputSupported('month');
let inputFullFormat = databaseDateFormat;
let inputMonthFormat = 'YYYY-MM';

function PartialDateUi<SCHEMA extends AnySchema>({
  model,
  dateField,
  precisionField,
  defaultPrecision,
  readOnly,
  inputId,
}: {
  readonly model: SpecifyResource<SCHEMA>;
  readonly dateField: keyof SCHEMA['fields'] & string;
  readonly precisionField: keyof SCHEMA['fields'] & string;
  readonly defaultPrecision: PartialDatePrecision;
  readonly readOnly: boolean;
  readonly inputId: string;
}): JSX.Element {
  const [precision, setPrecision] = React.useState<PartialDatePrecision>(
    () =>
      reversePrecision[model.get(precisionField) as 1 | 2 | 3] ??
      defaultPrecision
  );

  const errors = useSaveBlockers({ model, fieldName: dateField as string });
  const { inputRef, validationRef } = useValidation(errors);

  // Parsed date object
  const [moment, setMoment] = React.useState<
    ReturnType<typeof dayjs> | undefined
  >(undefined);
  const validDate = moment?.isValid() === true ? moment : undefined;
  // Unparsed raw input
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    let destructorCalled = false;

    function setInput(): void {
      if (destructorCalled) return;

      const value = model.get(dateField);
      setMoment(
        value === null ? undefined : dayjs(value, databaseDateFormat, true)
      );
    }

    function changePrecision(): void {
      if (destructorCalled) return;
      setPrecision(
        reversePrecision[model.get(precisionField) as 1 | 2 | 3] ??
          defaultPrecision
      );
    }

    model.on(`change:${dateField}`, setInput);
    model.on(`change:${precisionField}`, changePrecision);

    setInput();
    changePrecision();

    return (): void => {
      destructorCalled = true;
    };
  }, [model, dateField, precisionField, defaultPrecision]);

  const refIsFirstRender = React.useRef(true);
  React.useEffect(() => {
    /*
     * Don't update the value in the model on the initial useEffect execution
     * since "moment" is still undefined
     */
    if (refIsFirstRender.current)
      return (): void => {
        refIsFirstRender.current = false;
      };

    if (typeof moment === 'undefined') {
      // @ts-expect-error
      model.set(dateField, null);
      // @ts-expect-error
      model.set(precisionField, null);
      model.saveBlockers.remove(`invaliddate:${dateField}`);
    } else if (moment.isValid()) {
      const value = moment.format(databaseDateFormat);
      // @ts-expect-error
      model.set(dateField, value);
      // @ts-expect-error
      model.set(precisionField, precisions[precision]);
      model.saveBlockers.remove(`invaliddate:${dateField}`);
    } else {
      const validationMessage =
        precision === 'full'
          ? formsText('requiredFormat')(fullDateFormat())
          : precision === 'month-year'
          ? formsText('requiredFormat')(monthFormat())
          : formsText('invalidDate');
      model.saveBlockers.add(
        `invaliddate:${dateField}`,
        dateField,
        validationMessage
      );
    }
    return undefined;
  }, [model, moment, precision, dateField, precisionField]);

  function handleChange() {
    const input = inputRef.current;
    if (input === null || precision === 'year') return;

    const value = inputValue.trim();

    if (value === '') {
      setMoment(undefined);
      return;
    }
    /*
     * The date would be in this format if browser supports
     * input[type="date"] or input[type="month"]
     */
    const newMoment = dayjs(
      value,
      precision === 'full' ? 'YYYY-MM-DD' : 'YYYY-MM',
      true
    );
    /*
     * As a fallback, and on manual paste, default to preferred
     * date format
     */
    if (newMoment.isValid()) setMoment(newMoment);
    else
      setMoment(
        dayjs(
          value,
          precision === 'full' ? fullDateFormat() : monthFormat(),
          true
        )
      );
  }

  return (
    <div className="gap-x-1 flex">
      {!readOnly && (
        <label>
          <span className="sr-only">{formsText('datePrecision')}</span>
          <Select
            className="print:hidden"
            title={formsText('datePrecision')}
            value={precision}
            onChange={({ target }): void => {
              const precision = target.value as PartialDatePrecision;
              setPrecision(precision);
              const precisionIndex = precisions[precision];
              // @ts-expect-error Typing for dynamic references is not great
              model.set(precisionField, precisionIndex);
              model.saveBlockers.remove(`invaliddate:${dateField}`);
            }}
            onBlur={(): void => {
              let newMoment = dayjs(moment);
              if (precision === 'year' || precision === 'month-year')
                newMoment = newMoment.month(0);
              if (precision === 'month-year') newMoment = newMoment.date(1);

              setMoment(newMoment);
            }}
          >
            <option value="full">{commonText('fullDate')}</option>
            <option value="month-year">{formsText('monthYear')}</option>
            <option value="year">{dateParts.year}</option>
          </Select>
        </label>
      )}
      <label>
        <span className="sr-only">
          {precision === 'year'
            ? dateParts.year
            : precision === 'month-year'
            ? formsText('monthYear')
            : commonText('fullDate')}
        </span>
        <Input.Generic
          id={inputId}
          readOnly={readOnly}
          forwardRef={validationRef}
          {...(precision === 'year'
            ? {
                ...inputTypeYearAttributes,
                placeholder: formsText('yearPlaceholder'),
                // Format parsed date if valid. Else, use raw input
                value: validDate?.format('YYYY') ?? inputValue,
                onValueChange: (value): void => {
                  setInputValue(value);
                  const year = Number.parseInt(value);
                  if (!Number.isNaN(year)) setMoment(dayjs(moment).year(year));
                },
              }
            : {
                onBlur: handleChange,
                onValueChange(value): void {
                  setInputValue(value);
                  setMoment(undefined);
                },
                onPaste(event): void {
                  handleDatePaste(event, handleChange);
                },
                ...(precision === 'month-year'
                  ? {
                      type: monthType,
                      placeholder: monthFormat(),
                      // Format parsed date if valid. Else, use raw input
                      value: validDate?.format(inputMonthFormat) ?? inputValue,
                      title: moment?.format(monthFormat()),
                      ...(monthSupported
                        ? {}
                        : {
                            minLength: monthFormat().length,
                            maxLength: monthFormat().length,
                          }),
                    }
                  : {
                      type: dateType,
                      placeholder: fullDateFormat(),
                      // Format parsed date if valid. Else, use raw input
                      value: validDate?.format(inputFullFormat) ?? inputValue,
                      title: moment?.format(fullDateFormat()),
                      ...(dateSupported
                        ? {}
                        : {
                            minLength: fullDateFormat().length,
                            maxLength: fullDateFormat().length,
                          }),
                    }),
              })}
        />
      </label>
      {!readOnly &&
      ((precision === 'full' && !dateSupported) ||
        (precision === 'month-year' && !monthSupported)) ? (
        <Button.Icon
          icon="calendar"
          title={formsText('todayButtonDescription')}
          aria-label={formsText('today')}
          onClick={(): void => setMoment(dayjs())}
        />
      ) : undefined}
    </div>
  );
}

const View = createBackboneView(PartialDateUi, false);

export default UiPlugin.extend(
  {
    __name__: 'PartialDateUI',
    render() {
      if (!accessibleDatePickerEnabled()) {
        dateType = 'text';
        dateSupported = false;
      }
      if (!dateSupported) inputFullFormat = fullDateFormat();

      if (!accessibleMonthPickerEnabled()) {
        monthType = 'text';
        monthSupported = false;
      }
      if (!monthSupported) inputMonthFormat = monthFormat();

      if (
        this.model.isNew() &&
        `${this.$el.data('specify-default')}`.toLowerCase() === 'today'
      ) {
        this.model.set(this.init.df, getDateInputValue(new Date()));
      }

      this.model.fetchIfNotPopulated().then(this._render());
    },
    _render() {
      this.id = this.$el.prop('id');
      this.view = new View<AnySchema>({
        model: this.model,
        dateField: this.init.df.toLowerCase(),
        precisionField: this.init.tp.toLowerCase(),
        defaultPrecision: ['year', 'month-year'].includes(
          this.init.defaultprecision
        )
          ? this.init.defaultprecision
          : 'full',
        readOnly: Boolean(this.$el.prop('disabled')),
        inputId: this.id,
      }).render();

      this.$el.replaceWith(this.view.el);
      this.setElement(this.view.el);

      this.label = this.$el.parents().last().find(`label[for="${this.id}"]`)[0];
      if (!this.label.textContent)
        this.label.textContent = this.model.specifyModel.getField(
          this.init.df
        ).label;
    },
    remove() {
      this.view.remove();
      UiPlugin.prototype.remove.call(this);
    },
  },
  { pluginsProvided: ['PartialDateUI'] }
);

export function handleDatePaste(
  event: React.ClipboardEvent<HTMLInputElement>,
  updateHandler: () => void
): void {
  const target = event.target as HTMLInputElement;
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
    updateHandler();
  } catch (error) {
    console.error(error);
  }

  event.preventDefault();
  input.type = initialType;
}
