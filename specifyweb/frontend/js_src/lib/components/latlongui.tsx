import React from 'react';

import type { Locality } from '../datamodel';
import { Lat, Long, trimLatLong } from '../latlongutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { localityText } from '../localization/locality';
import type { FormMode } from '../parseform';
import { resourceOn } from '../resource';
import { Input, Select } from './basic';
import { useResourceValue } from './useresourcevalue';

type CoordinateType = 'Line' | 'Point' | 'Rectangle';

type Parsed = {
  readonly format: (step: number | undefined) => string;
  readonly asFloat: () => number;
  readonly soCalledUnit: () => number;
};

function Coordinate({
  resource,
  coordinateField,
  coordinateTextField,
  fieldType,
  isReadOnly,
  step,
  onFormatted: handleFormatted,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly coordinateField: `${'latitude' | 'longitude'}${1 | 2}`;
  readonly coordinateTextField: `${'lat' | 'long'}${1 | 2}text`;
  readonly fieldType: 'Lat' | 'Long';
  readonly isReadOnly: boolean;
  readonly step: number | undefined;
  readonly onFormatted: (value: string | undefined) => void;
}): JSX.Element {
  const { value, updateValue, validationRef, setValidation } = useResourceValue(
    resource,
    coordinateTextField,
    undefined
  );
  const isChanging = React.useRef<boolean>(false);
  React.useEffect(
    () =>
      resourceOn(resource, `change:${coordinateTextField}`, () => {
        if (isChanging.current) return;
        if (
          (resource.get(coordinateTextField) ?? '') === '' &&
          (resource.get(coordinateField) ?? '') !== ''
        )
          resource.set(coordinateTextField, resource.get(coordinateField));
      }),
    [resource, coordinateField, coordinateTextField]
  );

  React.useEffect(
    () =>
      resourceOn(resource, `change:${coordinateField}`, () => {
        if (isChanging.current) return;
        const coordinate = resource.get(coordinateField)?.toString() ?? '';
        const parsed = (fieldType === 'Lat' ? Lat : Long).parse(coordinate);
        updateValue(parsed?.asFloat() ?? null);
      }),
    [resource, coordinateField, updateValue, step, fieldType]
  );

  React.useEffect(() => {
    const trimmedValue = trimLatLong(value?.toString() ?? '');
    const hasValue = trimmedValue.length > 0;
    const parsed = hasValue
      ? (((fieldType === 'Lat' ? Lat : Long).parse(trimmedValue) ??
          undefined) as Parsed | undefined)
      : undefined;

    const isValid = !hasValue || parsed !== undefined;
    setValidation(isValid ? '' : formsText('invalidValue'));
    handleFormatted(
      isValid
        ? hasValue
          ? parsed?.format(step) ?? ''
          : commonText('notApplicable')
        : undefined
    );

    isChanging.current = true;
    resource.set(coordinateTextField, trimmedValue);
    resource.set(coordinateField, parsed?.asFloat() ?? null);
    resource.set('srcLatLongUnit', parsed?.soCalledUnit() ?? 3);
    resource.set('originalLatLongUnit', parsed?.soCalledUnit() ?? null);
    isChanging.current = false;
  }, [
    value,
    resource,
    coordinateField,
    coordinateTextField,
    fieldType,
    step,
    handleFormatted,
    setValidation,
  ]);

  return (
    <Input.Text
      forwardRef={validationRef}
      isReadOnly={isReadOnly}
      value={value?.toString() ?? ''}
      onValueChange={updateValue}
      // OnBlur={(): void => setCoordinate(trimLatLong(coordinate))}
    />
  );
}

function CoordinatePoint({
  resource,
  label,
  index,
  isReadOnly,
  step,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly label: string;
  readonly index: 1 | 2;
  readonly isReadOnly: boolean;
  readonly step: number | undefined;
}): JSX.Element {
  const [latitude, setLatitude] = React.useState<string | undefined>(
    commonText('notApplicable')
  );
  const [longitude, setLongitude] = React.useState<string | undefined>(
    commonText('notApplicable')
  );
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        <label>
          <span className="sr-only">{`${localityText(
            'latitude'
          )} ${index}`}</span>
          <Coordinate
            coordinateField={`latitude${index}`}
            coordinateTextField={`lat${index}text`}
            fieldType="Lat"
            isReadOnly={isReadOnly}
            resource={resource}
            step={step}
            onFormatted={setLatitude}
          />
        </label>
      </td>
      <td>
        <label>
          <span className="sr-only">{`${localityText(
            'longitude'
          )} ${index}`}</span>
          <Coordinate
            coordinateField={`longitude${index}`}
            coordinateTextField={`long${index}text`}
            fieldType="Long"
            isReadOnly={isReadOnly}
            resource={resource}
            step={step}
            onFormatted={setLongitude}
          />
        </label>
      </td>
      <td>
        <span>{latitude ?? '???'}</span>
        {', '}
        <span>{longitude ?? '???'}</span>
      </td>
    </tr>
  );
}

export function LatLongUi({
  resource,
  mode,
  id,
  step,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly mode: FormMode;
  readonly id: string | undefined;
  readonly step: number | undefined;
}): JSX.Element {
  const [coordinateType, setCoordinateType] = React.useState<CoordinateType>(
    () => resource.get('latLongType') ?? 'Point'
  );

  React.useEffect(
    () =>
      resourceOn(resource, 'change:latLongType', (): void =>
        setCoordinateType(
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          (resource.get('latLongType') as CoordinateType) ?? 'Point'
        )
      ),
    [resource]
  );

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
                <Select
                  disabled={mode === 'view'}
                  id={id}
                  name="type"
                  title={localityText('coordinateType')}
                  value={coordinateType}
                  onValueChange={(value): void => {
                    setCoordinateType(value as CoordinateType);
                    resource.set('latLongType', value);
                  }}
                >
                  <option value="Point">{localityText('point')}</option>
                  <option value="Line">{localityText('line')}</option>
                  <option value="Rectangle">{localityText('rectangle')}</option>
                </Select>
              </label>
            </th>
            <th scope="col">{localityText('latitude')}</th>
            <th scope="col">{localityText('longitude')}</th>
            <th scope="col">{localityText('parsed')}</th>
          </tr>
        </thead>
        <tbody>
          <CoordinatePoint
            index={1}
            isReadOnly={mode === 'view'}
            label={
              coordinateType === 'Point'
                ? localityText('coordinates')
                : coordinateType === 'Line'
                ? commonText('start')
                : localityText('northWestCorner')
            }
            resource={resource}
            step={step}
          />
          {coordinateType === 'Point' ? undefined : (
            <CoordinatePoint
              index={2}
              isReadOnly={mode === 'view'}
              label={
                coordinateType === 'Line'
                  ? commonText('end')
                  : localityText('southEastCorner')
              }
              resource={resource}
              step={step}
            />
          )}
        </tbody>
      </table>
    </fieldset>
  );
}
