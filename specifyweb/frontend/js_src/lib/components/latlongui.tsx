import React from 'react';

import * as latlongutils from '../latlongutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import localityText from '../localization/locality';
import UIPlugin from '../uiplugin';
import createBackboneView from './reactbackboneextend';

type CoordinateType = 'point' | 'line' | 'rectangle';

type Parsed = {
  readonly format: () => string;
  readonly asFloat: () => number;
  readonly soCalledUnit: () => number;
};

function Coordinate({
  model,
  coordinateField,
  coordinateTextField,
  fieldType,
  readOnly,
  onChange: handleChange,
}: {
  readonly model: SpecifyResource;
  readonly coordinateField: string;
  readonly coordinateTextField: string;
  readonly fieldType: 'Lat' | 'Long';
  readonly readOnly: boolean;
  readonly onChange: (parsed: string) => void;
}): JSX.Element {
  const [coordinate, setCoordinate] = React.useState<string>(
    () => (model.get(coordinateTextField) || model.get(coordinateField)) ?? ''
  );

  const onChange = (raw: string, formatted: string | undefined) =>
    handleChange(raw === '' ? commonText('notApplicable') : formatted ?? '???');

  React.useEffect(() => {
    const handleChange = (coordinate: string) =>
      destructorCalled
        ? undefined
        : onChange(
            coordinate,
            (
              latlongutils[fieldType].parse(coordinate) as Parsed | null
            )?.format()
          );
    model.on(`change: ${coordinateTextField}`, () =>
      handleChange(model.get(coordinateTextField))
    );
    model.on(`change: ${coordinateField}`, () =>
      handleChange(model.get(coordinateField))
    );

    let destructorCalled = false;
    // Update parent's Preview column with initial values on the first render
    handleChange(coordinate);
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  return (
    <input
      type="text"
      value={coordinate}
      readOnly={readOnly}
      onChange={
        readOnly
          ? undefined
          : ({ target }): void => {
              setCoordinate(target.value);
              const hasValue = target.value.trim() !== '';
              const parsed = hasValue
                ? ((latlongutils[fieldType].parse(target.value) ??
                    undefined) as Parsed | undefined)
                : undefined;
              onChange(target.value.trim(), parsed?.format());

              model.set({
                [coordinateTextField]: target.value,
                [coordinateField]: parsed?.asFloat() ?? null,
                srclatlongunit: parsed?.soCalledUnit() ?? null,
                originallatlongunit: parsed?.soCalledUnit() ?? null,
              });
            }
      }
    />
  );
}

function CoordinatePoint({
  model,
  label,
  index,
  readOnly,
}: {
  readonly model: SpecifyResource;
  readonly label: string;
  readonly index: 1 | 2;
  readonly readOnly: boolean;
}): JSX.Element {
  const [latitude, setLatitude] = React.useState<string>(
    commonText('notApplicable')
  );
  const [longitude, setLongitude] = React.useState<string>(
    commonText('notApplicable')
  );
  return (
    <tr>
      <th>{label}</th>
      <td>
        <label>
          <span className="sr-only">{`${localityText(
            'latitude'
          )} ${index}`}</span>
          <Coordinate
            model={model}
            coordinateField={`Latitude${index}`}
            coordinateTextField={`Lat${index}Text`}
            fieldType={`Lat`}
            readOnly={readOnly}
            onChange={setLatitude}
          />
        </label>
      </td>
      <td>
        <label>
          <span className="sr-only">{`${localityText(
            'longitude'
          )} ${index}`}</span>
          <Coordinate
            model={model}
            coordinateField={`Longitude${index}`}
            coordinateTextField={`Long${index}Text`}
            fieldType={`Lat`}
            readOnly={readOnly}
            onChange={setLongitude}
          />
        </label>
      </td>
      <td>
        <span>{latitude}</span>
        {', '}
        <span>{longitude}</span>
      </td>
    </tr>
  );
}

function LatLongUi({
  model,
  readOnly,
}: {
  readonly model: SpecifyResource;
  readonly readOnly: boolean;
}): JSX.Element {
  const [coordinateType, setCoordinateType] = React.useState<CoordinateType>(
    () => model.get('latlongtype') ?? 'point'
  );

  React.useEffect(() => {
    model.on('change: latlongtype', () =>
      destructorCalled
        ? undefined
        : setCoordinateType(model.get('latlongtype') ?? 'point')
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th scope="col">
              <label>
                <span className="sr-only">
                  {localityText('coordinateType')}
                </span>
                <select
                  name="type"
                  title={localityText('coordinateType')}
                  value={coordinateType}
                  disabled={readOnly}
                  onChange={
                    readOnly
                      ? undefined
                      : ({ target }): void => {
                          setCoordinateType(target.value as CoordinateType);
                          model.set('latlongtype', target.value);
                        }
                  }
                >
                  <option value="point">{localityText('point')}</option>
                  <option value="line">{localityText('line')}</option>
                  <option value="rectangle">{localityText('rectangle')}</option>
                </select>
              </label>
            </th>
            <th scope="col">{localityText('latitude')}</th>
            <th scope="col">{localityText('longitude')}</th>
            <th scope="col">{localityText('parsed')}</th>
          </tr>
        </thead>
        <tbody>
          <CoordinatePoint
            model={model}
            label={
              coordinateType === 'point'
                ? localityText('coordinates')
                : coordinateType === 'line'
                ? commonText('start')
                : localityText('northWestCorner')
            }
            index={1}
            readOnly={readOnly}
          />
          {coordinateType === 'point' ? undefined : (
            <CoordinatePoint
              model={model}
              label={
                coordinateType === 'line'
                  ? commonText('end')
                  : localityText('southEastCorner')
              }
              index={2}
              readOnly={readOnly}
            />
          )}
        </tbody>
      </table>
    </>
  );
}

// TODO: move tagName and className attributes into react component
const View = createBackboneView(LatLongUi, {
  tagName: 'fieldset',
  className: 'specifyplugin-latlonui',
});

export default UIPlugin.extend(
  {
    __name__: 'LatLongUI',
    initialize() {
      Reflect.apply(UIPlugin.prototype.initialize, this, arguments);
    },
    render() {
      this.model.fetchIfNotPopulated().then(() => {
        this.view = new View({
          model: this.model,
          readOnly: this.$el.prop('disabled'),
        }).render();
        this.$el.replaceWith(this.view.el);
        this.setElement(this.view.el);
      });
      return this;
    },
    remove() {
      this.view?.remove();
      UIPlugin.prototype.remove.call(this);
    },
  },
  { pluginsProvided: ['LatLonUI'] }
);
