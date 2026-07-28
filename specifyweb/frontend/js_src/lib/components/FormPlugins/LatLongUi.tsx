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
export type CoordinateType = (typeof coordinateType)[number];

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
  /**
   * Whether the current value arrived from an actual change — the user typing, or
   * one of the two resourceOn handlers below reacting to a field being set
   * elsewhere — as opposed to simply being read off the resource when the form
   * first rendered. Only a real change may write back; see the guard in the
   * parsing effect.
   */
  const hasValueChanged = React.useRef<boolean>(false);
  /*
   * Declared before every other effect so it runs first on a resource swap.
   * A record selector slides a NEW resource into this same component instance —
   * useFieldParser notes that "Resource changes when sliding in a record
   * selector, but react reuses the DOM component". Without this reset the latch
   * stays set after any edit and the write-back gate below would stand open for
   * every subsequent record, reintroducing the very corruption this guards.
   */
  React.useEffect(() => {
    hasValueChanged.current = false;
  }, [resource, coordinateTextField]);

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
            /*
             * Deliberately does NOT set hasValueChanged: this handler fires on
             * mount (resourceOn(..., true)), so treating it as a change would
             * write to a record the curator has only opened. Display updates;
             * nothing persists until there is a real edit.
             */
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
          hasValueChanged.current = true;
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

    const rawValue = value?.toString() ?? '';
    const trimmedValue = trimLatLong(rawValue);
    const hasValue = trimmedValue.length > 0;
    /*
     * Parse the RAW value, not the trimmed one. parse() trims internally, but it
     * also inspects what trimming would discard so that an unrecognised direction
     * letter makes the value invalid instead of silently changing hemisphere.
     * Handing it a pre-trimmed string throws that information away before the
     * check can run — "96° 57' O" would already have become "96° 57'" and would
     * parse happily as EAST.
     */
    const parsed = hasValue
      ? ((fieldType === 'Lat' ? Lat : Long).parse(rawValue) ?? undefined)
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
          ? (parsed?.format(step) ?? '')
          : commonText.notApplicable()
        : undefined
    );

    /**
     * Opening a record must never modify it.
     *
     * Everything above this point is display-only — the validation message and
     * the formatted "Parsed" column. Everything below writes to the resource and
     * marks it dirty, so it may only run in response to an actual user edit.
     *
     * Without this guard the effect fires on first render and rewrites
     * coordinateTextField with the trimmed string. trimLatLong() drops every
     * character outside [\s\d"'\-.:ensw°], so a locality stored as "96° 57' O"
     * (Spanish Oeste = West, longitude -96.95) is silently rewritten to
     * "96° 57' " and +96.95 — the opposite hemisphere — and the evidence that it
     * was ever West is destroyed. The verbatim text is the value of record here;
     * the decimal is derived from it. That makes this data loss, not a display
     * concern, and it happens without the user touching a field.
     */
    if (!hasValueChanged.current) return;

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
  const handleValueChange = React.useCallback(
    (newValue: string): void => {
      hasValueChanged.current = true;
      updateValue(newValue);
    },
    [updateValue]
  );
  return (
    <Input.Text
      forwardRef={validationRef}
      isReadOnly={isReadOnly}
      value={value?.toString() ?? ''}
      onValueChange={handleValueChange}
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
