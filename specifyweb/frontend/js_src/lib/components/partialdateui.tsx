import React from 'react';

import dateFormat, {
  accessibleDatePickerEnabled,
  accessibleMonthPickerEnabled,
  monthFormat,
} from '../dateformat';
import dayjs, { getDateInputValue } from '../dayjs';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { getValidationAttributes, resolveParser } from '../uiparse';
import UIPlugin from '../uiplugin';
import createBackboneView from './reactbackboneextend';
import { defined, RR } from '../types';

function isInputSupported(type: string) {
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

let dateType = 'date';
let monthType = 'month';
let dateSupported = isInputSupported('date');
let monthSupported = isInputSupported('month');
let inputFullFormat = 'YYYY-MM-DD';
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
}) {
  const [precision, setPrecision] = React.useState<Precision>(
    () =>
      reversePrecision[model.get(precisionField) as number] ?? defaultPrecision
  );
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [moment, setMoment] = React.useState<
    ReturnType<typeof dayjs> | undefined
  >(undefined);

  React.useEffect(() => {
    function setInput() {
      if (destructorCalled) return;

      const value = model.get(dateField);
      setMoment(dayjs(value));
    }

    function setPrecision() {
      if (destructorCalled) return;
    }

    model.on(`change:${dateField.toLowerCase()}`, setInput);
    model.on(`change:${precisionField.toLowerCase()}`, setPrecision);

    setInput();
    setPrecision();

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  React.useEffect(() => {
    if (typeof moment === 'undefined') {
      model.set(dateField, null);
      model.set(precisionField, null);
      model.saveBlockers.remove(`invaliddate:${dateField}`);
      console.log('setting date to null');
    } else if (moment.isValid()) {
      const value = moment.format('YYYY-MM-DD');
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
  }, [moment]);

  function handleChange() {
    const input = inputRef.current;
    if (input === null || precision === 'year') return;

    const value = input.value.trim();
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
    <>
      {!readOnly && (
        <label>
          <span className="sr-only">{formsText('datePrecision')}</span>
          <select
            className="partialdateui-precision"
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
            <option value="year">{commonText('year')}</option>
          </select>
        </label>
      )}
      <label>
        <span className="sr-only">
          {precision === 'year'
            ? commonText('year')
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
                value: moment?.format('YYYY'),
                onChange: ({ target }): void => {
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
                onPaste(event): void {
                  handleDatePaste(event, handleChange);
                },
                ...(precision === 'month-year'
                  ? {
                      type: monthType,
                      placeholder: monthFormat(),
                      value: moment?.format(inputMonthFormat),
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
                      value: moment?.format(inputFullFormat),
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
        <button
          type="button"
          className="partialdateui-current-date"
          title={formsText('todayButtonDescription')}
          onClick={(): void => setMoment(dayjs())}
        >
          <span className="ui-icon ui-icon-calendar">{formsText('today')}</span>
        </button>
      ) : undefined}
    </>
  );
}

const View = createBackboneView(PartialDateUi);

export default UIPlugin.extend(
  {
    __name__: 'PartialDateUI',
    className: 'partialdateui',
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
        precisionField: this.init.tf,
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
