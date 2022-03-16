import React from 'react';

import type { Locality } from '../datamodel';
import * as latlongutils from '../latlongutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import localityText from '../localization/locality';
import { Input } from './basic';

type CoordinateType = 'point' | 'line' | 'rectangle';

type Parsed = {
  readonly format: () => string;
  readonly asFloat: () => number;
  readonly soCalledUnit: () => number;
};

function Coordinate({
  resource,
  coordinateField,
  coordinateTextField,
  fieldType,
  isReadOnly,
  onChange: handleChange,
}: {
  readonly resource: SpecifyResource<Locality>;
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
  readonly isReadOnly: boolean;
  readonly onChange: (parsed: string) => void;
}): JSX.Element {
  const [coordinate, setCoordinate] = React.useState<string>(
    () =>
      (resource.get(coordinateTextField) ||
        resource.get(coordinateField)?.toString()) ??
      ''
  );

  const onChange = (raw: string, formatted: string | undefined) =>
    handleChange(raw === '' ? commonText('notApplicable') : formatted ?? '???');

  React.useEffect(() => {
    const handleChange = (coordinate: string) =>
      onChange(
        coordinate,
        (latlongutils[fieldType].parse(coordinate) as Parsed | null)?.format()
      );
    const handleCoordinateTextChange = () =>
      handleChange(resource.get(coordinateTextField));
    resource.on(`change: ${coordinateTextField}`, handleCoordinateTextChange);
    const handleCoordinateChange = () =>
      handleChange(resource.get(coordinateField)?.toString() ?? '');
    resource.on(`change: ${coordinateField}`, handleCoordinateChange);

    // Update parent's Preview column with initial values on the first render
    handleChange(coordinate);
    return (): void => {
      resource.off(
        `change: ${coordinateTextField}`,
        handleCoordinateTextChange
      );
      resource.off(`change: ${coordinateField}`, handleCoordinateChange);
    };
  }, [coordinateField, coordinateTextField, fieldType]);

  return (
    <Input.Text
      value={coordinate}
      readOnly={isReadOnly}
      onValueChange={(value): void => {
        setCoordinate(value);
        const hasValue = value.trim() !== '';
        const parsed = hasValue
          ? ((latlongutils[fieldType].parse(value) ?? undefined) as
              | Parsed
              | undefined)
          : undefined;
        onChange(value.trim(), parsed?.format());

        resource.set(coordinateTextField, value);
        resource.set(coordinateField, parsed?.asFloat() ?? null);
        resource.set('srcLatLongUnit', parsed?.soCalledUnit() ?? 3);
        resource.set('originalLatLongUnit', parsed?.soCalledUnit() ?? null);
      }}
    />
  );
}

function CoordinatePoint({
  resource,
  label,
  index,
  isReadOnly,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly label: string;
  readonly index: 1 | 2;
  readonly isReadOnly: boolean;
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
            resource={resource}
            coordinateField={`latitude${index}`}
            coordinateTextField={`lat${index}text`}
            fieldType={`Lat`}
            isReadOnly={isReadOnly}
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
            resource={resource}
            coordinateField={`longitude${index}`}
            coordinateTextField={`long${index}text`}
            fieldType={`Lat`}
            isReadOnly={isReadOnly}
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

export function LatLongUi({
  resource,
  isReadOnly,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const [coordinateType, setCoordinateType] = React.useState<CoordinateType>(
    () => resource.get('latLongType') ?? 'point'
  );

  React.useEffect(() => {
    const handleChange = () =>
      setCoordinateType(resource.get('latLongType') ?? 'point');
    resource.on('change: latlongtype');

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
                  disabled={isReadOnly}
                  onChange={
                    isReadOnly
                      ? undefined
                      : ({ target }): void => {
                          setCoordinateType(target.value as CoordinateType);
                          resource.set('latLongType', target.value);
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
            resource={resource}
            label={
              coordinateType === 'point'
                ? localityText('coordinates')
                : coordinateType === 'line'
                ? commonText('start')
                : localityText('northWestCorner')
            }
            index={1}
            isReadOnly={isReadOnly}
          />
          {coordinateType === 'point' ? undefined : (
            <CoordinatePoint
              resource={resource}
              label={
                coordinateType === 'line'
                  ? commonText('end')
                  : localityText('southEastCorner')
              }
              index={2}
              isReadOnly={isReadOnly}
            />
          )}
        </tbody>
      </table>
    </fieldset>
  );
}
