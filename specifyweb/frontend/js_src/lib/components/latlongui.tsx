import React from 'react';

import type { Locality } from '../datamodel';
import * as latlongutils from '../latlongutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import localityText from '../localization/locality';
import { UiPlugin } from '../uiplugin';
import { Input } from './basic';
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
  readonly model: SpecifyResource<Locality>;
  readonly coordinateField:
    | 'latitude1'
    | 'latitude2'
    | 'longitude1'
    | 'longitude2';
  readonly coordinateTextField:
    | 'lat1text'
    | 'lat2text'
    | 'long1text'
    | 'long2text';
  readonly fieldType: 'Lat' | 'Long';
  readonly readOnly: boolean;
  readonly onChange: (parsed: string) => void;
}): JSX.Element {
  const [coordinate, setCoordinate] = React.useState<string>(
    () =>
      (model.get(coordinateTextField) ||
        model.get(coordinateField)?.toString()) ??
      ''
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
      handleChange(model.get(coordinateField)?.toString() ?? '')
    );

    let destructorCalled = false;
    // Update parent's Preview column with initial values on the first render
    handleChange(coordinate);
    return (): void => {
      destructorCalled = true;
    };
  }, [coordinateField, coordinateTextField, fieldType]);

  return (
    <Input.Text
      value={coordinate}
      readOnly={readOnly}
      onValueChange={
        readOnly
          ? undefined
          : (value): void => {
              setCoordinate(value);
              const hasValue = value.trim() !== '';
              const parsed = hasValue
                ? ((latlongutils[fieldType].parse(value) ?? undefined) as
                    | Parsed
                    | undefined)
                : undefined;
              onChange(value.trim(), parsed?.format());

              model.set(coordinateTextField, value);
              model.set(coordinateField, parsed?.asFloat() ?? null);
              model.set('srcLatLongUnit', parsed?.soCalledUnit() ?? 3);
              model.set('originalLatLongUnit', parsed?.soCalledUnit() ?? null);
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
  readonly model: SpecifyResource<Locality>;
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
            coordinateField={`latitude${index}`}
            coordinateTextField={`lat${index}text`}
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
            coordinateField={`longitude${index}`}
            coordinateTextField={`long${index}text`}
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
  readonly model: SpecifyResource<Locality>;
  readonly readOnly: boolean;
}): JSX.Element {
  const [coordinateType, setCoordinateType] = React.useState<CoordinateType>(
    () => model.get('latLongType') ?? 'point'
  );

  React.useEffect(() => {
    model.on('change: latlongtype', () =>
      destructorCalled
        ? undefined
        : setCoordinateType(model.get('latLongType') ?? 'point')
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  return (
    <fieldset>
      <table className="w-full text-center">
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
                          model.set('latLongType', target.value);
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
    </fieldset>
  );
}

const View = createBackboneView(LatLongUi);

export default UiPlugin.extend(
  {
    __name__: 'LatLongUI',
    initialize() {
      Reflect.apply(UiPlugin.prototype.initialize, this, arguments);
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
      UiPlugin.prototype.remove.call(this);
    },
  },
  { pluginsProvided: ['LatLonUI'] }
);
