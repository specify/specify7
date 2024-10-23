import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useResourceValue } from '../../hooks/useResourceValue';
import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { Lat, Long, trimLatLong } from '../../utils/latLong';
import { Input, Select } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import type { Locality } from '../DataModel/types';

export const coordinateType = ['Point', 'Line', 'Rectangle'] as const;
export type CoordinateType = typeof coordinateType[number];

function Coordinate({
  resource,
  coordinateField,
  coordinateTextField,
  fieldType,
  step,
  onFormatted: handleFormatted,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly coordinateField: `${'latitude' | 'longitude'}${1 | 2}`;
  readonly coordinateTextField: `${'lat' | 'long'}${1 | 2}text`;
  readonly fieldType: 'Lat' | 'Long';
  readonly step: number | undefined;
  readonly onFormatted: (value: string | undefined) => void;
}): JSX.Element {
  const { value, updateValue, validationRef, setValidation, parser } =
    useResourceValue(
      resource,
      tables.Locality.strictGetField(coordinateTextField),
      undefined,
      false
    );
  const isChanging = React.useRef<boolean>(false);
  React.useEffect(
    () =>
      resourceOn(
        resource,
        `change:${coordinateTextField}`,
        () => {
          if (isChanging.current) return;
          if (
            (resource.get(coordinateTextField) ?? '') === '' &&
            (resource.get(coordinateField) ?? '') !== ''
          )
            updateValue(resource.get(coordinateField));
        },
        true
      ),
    [resource, coordinateField, coordinateTextField]
  );

  React.useEffect(
    () =>
      resourceOn(
        resource,
        `change:${coordinateField}`,
        () => {
          if (isChanging.current) return;
          const coordinate = resource.get(coordinateField)?.toString() ?? '';
          const parsed = (fieldType === 'Lat' ? Lat : Long).parse(coordinate);
          updateValue(parsed?.asFloat() ?? null);
        },
        // Only run this when coordinate field is changed externally
        false
      ),
    [resource, coordinateField, updateValue, step, fieldType]
  );

  const isLoading = React.useRef<boolean>(true);
  React.useEffect(() => {
    if (isLoading.current && value === undefined) return;
    else isLoading.current = false;

    const trimmedValue = trimLatLong(value?.toString() ?? '');
    const hasValue = trimmedValue.length > 0;
    const parsed = hasValue
      ? (fieldType === 'Lat' ? Lat : Long).parse(trimmedValue) ?? undefined
      : undefined;

    const isValid = !hasValue || parsed !== undefined;
    const latLongBlockers = isValid
      ? []
      : [
          fieldType === 'Lat'
            ? localityText.validLatitude()
            : localityText.validLongitude(),
        ];
    setValidation(latLongBlockers);
    handleFormatted(
      isValid
        ? hasValue
          ? parsed?.format(step) ?? ''
          : commonText.notApplicable()
        : undefined
    );

    isChanging.current = true;

    /**
     * Do not set unload protect because very precise coodinateFields
     * may experience a change of precision during the conversion from
     * string to float
     */
    resource.set(coordinateField, parsed?.asFloat() ?? null, { silent: true });
    resource.set(coordinateTextField, trimmedValue);
    // Since these fields are no used by sp7, they shouldn't trigger unload protect
    resource.set(
      'srcLatLongUnit',
      parsed?.soCalledUnit() ??
        // Don't trigger unload protect needlessly
        (resource.needsSaved ? undefined : resource.get('srcLatLongUnit')) ??
        1,
      { silent: true }
    );
    resource.set(
      'originalLatLongUnit',
      parsed?.soCalledUnit() ??
        (resource.needsSaved
          ? undefined
          : resource.get('originalLatLongUnit')) ??
        null,
      { silent: true }
    );
    isChanging.current = false;
  }, [
    value,
    /*
     * Don't update this when resource changes, as that case is handled by the
     * useEffect hooks above
     */
    coordinateField,
    coordinateTextField,
    fieldType,
    step,
    handleFormatted,
    parser,
  ]);

  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <Input.Text
      forwardRef={validationRef}
      isReadOnly={isReadOnly}
      value={value?.toString() ?? ''}
      onValueChange={updateValue}
    />
  );
}

function CoordinatePoint({
  resource,
  label,
  index,
  step,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly label: LocalizedString;
  readonly index: 1 | 2;
  readonly step: number | undefined;
}): JSX.Element {
  const [latitude = '???', setLatitude] = React.useState<string | undefined>(
    commonText.notApplicable()
  );
  const [longitude = '???', setLongitude] = React.useState<string | undefined>(
    commonText.notApplicable()
  );
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        <label>
          <span className="sr-only">{`${localityText.latitude()} ${index}`}</span>
          <Coordinate
            coordinateField={`latitude${index}`}
            coordinateTextField={`lat${index}text`}
            fieldType="Lat"
            resource={resource}
            step={step}
            onFormatted={setLatitude}
          />
        </label>
      </td>
      <td>
        <label>
          <span className="sr-only">{`${localityText.longitude()} ${index}`}</span>
          <Coordinate
            coordinateField={`longitude${index}`}
            coordinateTextField={`long${index}text`}
            fieldType="Long"
            resource={resource}
            step={step}
            onFormatted={setLongitude}
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
  id,
  step,
  latLongType,
}: {
  readonly resource: SpecifyResource<Locality>;
  readonly id: string | undefined;
  readonly step: number | undefined;
  readonly latLongType: CoordinateType;
}): JSX.Element {
  const [coordinateType, setCoordinateType] = React.useState<CoordinateType>(
    () => resource.get('latLongType') ?? latLongType
  );

  React.useEffect(
    () =>
      resourceOn(
        resource,
        'change:latLongType',
        (): void =>
          setCoordinateType(
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            (resource.get('latLongType') as CoordinateType) ?? 'Point'
          ),
        false
      ),
    [resource]
  );

  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <fieldset>
      <table className="w-full text-center">
        <thead>
          <tr>
            <th scope="col">
              <label>
                <span className="sr-only">{localityText.coordinateType()}</span>
                <Select
                  disabled={isReadOnly}
                  id={id}
                  name="type"
                  value={coordinateType}
                  onValueChange={(value): void => {
                    setCoordinateType(value as CoordinateType);
                    resource.set('latLongType', value);
                  }}
                >
                  <option value="Point">{localityText.point()}</option>
                  <option value="Line">{localityText.line()}</option>
                  <option value="Rectangle">{localityText.rectangle()}</option>
                </Select>
              </label>
            </th>
            <th scope="col">{localityText.latitude()}</th>
            <th scope="col">{localityText.longitude()}</th>
            <th scope="col">{localityText.parsed()}</th>
          </tr>
        </thead>
        <tbody>
          <CoordinatePoint
            index={1}
            label={
              coordinateType === 'Point'
                ? localityText.coordinates()
                : coordinateType === 'Line'
                ? commonText.start()
                : localityText.northWestCorner()
            }
            resource={resource}
            step={step}
          />
          {coordinateType === 'Point' ? undefined : (
            <CoordinatePoint
              index={2}
              label={
                coordinateType === 'Line'
                  ? commonText.end()
                  : localityText.southEastCorner()
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
