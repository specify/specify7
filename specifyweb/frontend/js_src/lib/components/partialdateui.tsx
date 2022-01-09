import React from 'react';

import dateFormat, {
  accessibleDatePickerEnabled,
  accessibleMonthPickerEnabled,
  monthFormat,
} from '../dateformat';
import dayjs, { getDateInputValue } from '../dayjs';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { RR } from '../types';
import { defined } from '../types';
import { getValidationAttributes, resolveParser } from '../uiparse';
import UIPlugin from '../uiplugin';
import { dateParts } from './internationalization';
import createBackboneView from './reactbackboneextend';
import { SpecifyResource } from '../legacytypes';
import { Button } from './basic';

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
  { type: 'year' },
  defined(resolveParser({ type: 'year' }))
);

const precisions = { full: 1, 'month-year': 2, year: 3 } as const;
const reversePrecision: RR<number, Precision> = {
  1: 'full',
  2: 'month-year',
  3: 'year',
};
type Precision = keyof typeof precisions;

const databaseFormat = 'YYYY-MM-DD';
// These may be reassigned after remotePrefs are loaded:
let dateType = 'date';
let monthType = 'month';
let dateSupported = isInputSupported('date');
let monthSupported = isInputSupported('month');
let inputFullFormat = databaseFormat;
let inputMonthFormat = 'YYYY-MM';

function PartialDateUi({
  model,
  dateField,
  precisionField,
  defaultPrecision,
  readOnly,
  inputId,
}: {
  readonly model: SpecifyResource;
  readonly dateField: string;
  readonly precisionField: string;
  readonly defaultPrecision: Precision;
  readonly readOnly: boolean;
  readonly inputId: string;
}): JSX.Element {
  const [precision, setPrecision] = React.useState<Precision>(
    () =>
      reversePrecision[model.get<number>(precisionField)] ?? defaultPrecision
  );
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Parsed date object
  const [moment, setMoment] = React.useState<
    ReturnType<typeof dayjs> | undefined
  >(undefined);
  const validDate = moment?.isValid() ? moment : undefined;
  // Unparsed raw input
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    let destructorCalled = false;

    function setInput() {
      if (destructorCalled) return;

      const value = model.get<string>(dateField);
      setMoment(dayjs(value, databaseFormat, true));
    }

    function setPrecision() {
      if (destructorCalled) return;
    }

    model.on(`change:${dateField.toLowerCase()}`, setInput);
    model.on(`change:${precisionField.toLowerCase()}`, setPrecision);

    setInput();
    setPrecision();

    return (): void => {
      destructorCalled = true;
    };
  }, []);

  const refIsFirstRender = React.useRef(true);
  React.useEffect(() => {
    /*
     * Don't update the value in the model on the initial useEffect execution
     * since "moment" is still undefined
     */
    if (refIsFirstRender.current)
      return () => {
        refIsFirstRender.current = false;
      };

    if (typeof moment === 'undefined') {
      model.set(dateField, null);
      model.set(precisionField, null);
      model.saveBlockers.remove(`invaliddate:${dateField}`);
      console.log('setting date to null');
    } else if (moment.isValid()) {
      const value = moment.format(databaseFormat);
      model.set(dateField, value);
      model.set(precisionField, precisions[precision]);
      console.log('setting date to', value);
      model.saveBlockers.remove(`invaliddate:${dateField}`);
    } else {
      const validationMessage =
        precision === 'full'
          ? formsText('requiredFormat')(dateFormat())
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
  }, [moment]);

  function handleChange() {
    const input = inputRef.current;
    if (input === null || precision === 'year') return;

    const value = inputValue.trim();
    /*
     * The date would be in this format if browser supports
     * input[type="date"] or input[type="month"]
     */
    let newMoment = value
      ? dayjs(value, precision === 'full' ? 'YYYY-MM-DD' : 'YYYY-MM', true)
      : undefined;
    /*
     * As a fallback, and on manual paste, default to preferred
     * date format
     */
    if (newMoment?.isValid() !== true)
      newMoment = dayjs(
        value,
        precision === 'full' ? dateFormat() : monthFormat(),
        true
      );
    setMoment(newMoment);
  }

  return (
    <div className="gap-x-1 flex">
      {!readOnly && (
        <label>
          <span className="sr-only">{formsText('datePrecision')}</span>
          <select
            className="print:hidden"
            title={formsText('datePrecision')}
            value={precision}
            onChange={({ target }): void => {
              const precision = target.value as Precision;
              setPrecision(precision);
              const precisionIndex = precisions[precision];
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
          </select>
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
        <input
          id={inputId}
          readOnly={readOnly}
          ref={inputRef}
          onFocus={({ target }): void =>
            model.saveBlockers.handleFocus(target, dateField)
          }
          {...(precision === 'year'
            ? {
                ...inputTypeYearAttributes,
                placeholder: formsText('yearPlaceholder'),
                // Format parsed date if valid. Else, use raw input
                value: validDate?.format('YYYY') ?? inputValue,
                onChange: ({ target }): void => {
                  setInputValue(target.value);
                  const year = Number.parseInt(target.value);
                  if (!Number.isNaN(year))
                    setMoment(
                      (typeof moment === 'undefined'
                        ? dayjs()
                        : dayjs(moment)
                      ).year(year)
                    );
                },
              }
            : {
                onBlur: handleChange,
                onChange({ target }): void {
                  setInputValue(target.value);
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
                      placeholder: dateFormat(),
                      // Format parsed date if valid. Else, use raw input
                      value: validDate?.format(inputFullFormat) ?? inputValue,
                      title: moment?.format(dateFormat()),
                      ...(dateSupported
                        ? {}
                        : {
                            minLength: dateFormat().length,
                            maxLength: dateFormat().length,
                          }),
                    }),
              })}
        />
      </label>
      {!readOnly &&
      ((precision === 'full' && !dateSupported) ||
        (precision === 'month-year' && !monthSupported)) ? (
        <Button.Simple
          title={formsText('todayButtonDescription')}
          onClick={(): void => setMoment(dayjs())}
        >
          <span className="ui-icon ui-icon-calendar">{formsText('today')}</span>
        </Button.Simple>
      ) : undefined}
    </div>
  );
}

const View = createBackboneView(PartialDateUi);

export default UIPlugin.extend(
  {
    __name__: 'PartialDateUI',
    render() {
      if (!accessibleDatePickerEnabled()) {
        dateType = 'text';
        dateSupported = false;
      }
      if (!dateSupported) inputFullFormat = dateFormat();

      if (!accessibleMonthPickerEnabled()) {
        monthType = 'text';
        monthSupported = false;
      }
      if (!monthSupported) inputMonthFormat = monthFormat();

      if (
        this.model.isNew() &&
        `${this.$el.data('specify-default')}`.toLowerCase() === 'today'
      ) {
        this.model.set(
          this.init.df.toLowerCase(),
          getDateInputValue(new Date())
        );
      }

      this.model.fetchIfNotPopulated().done(this._render());
    },
    _render() {
      this.id = this.$el.prop('id');
      this.view = new View({
        model: this.model,
        dateField: this.init.df,
        precisionField: this.init.tp,
        defaultPrecision: ['year', 'month-year'].includes(
          this.init.defaultprecision
        )
          ? this.init.defaultprecision
          : 'full',
        readOnly: Boolean(this.$el.prop('disabled')),
        inputId: this.id,
      }).render();
      this.view.el.classList.remove('contents');

      this.$el.replaceWith(this.view.el);
      this.setElement(this.view.el);

      this.label = this.$el.parents().last().find(`label[for="${this.id}"]`)[0];
      if (!this.label.textContent)
        this.label.textContent = this.model.specifyModel
          .getField(this.init.df)
          .getLocalizedName();
    },
    remove() {
      this.view.remove();
      UIPlugin.prototype.remove.call(this);
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
