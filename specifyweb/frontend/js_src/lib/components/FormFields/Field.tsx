import React from 'react';

import { useResourceValue } from '../../hooks/useResourceValue';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import type { Parser } from '../../utils/parser/definitions';
import { getValidationAttributes } from '../../utils/parser/definitions';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext, SearchDialogContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { raise } from '../Errors/Crash';
import { fetchPathAsString } from '../Formatters/formatters';
import { collectionPreferences } from '../Preferences/collectionPreferences';
import { userPreferences } from '../Preferences/userPreferences';

export function UiField({
  field,
  ...props
}: {
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly field: LiteralField | Relationship | undefined;
  readonly parser?: Parser;
}): JSX.Element {
  return field?.isRelationship === true ? (
    <RelationshipField field={field} {...props} />
  ) : (
    <Field field={field} {...props} />
  );
}

/*
 * If tried to render a -to-many relationship, display a readOnly aggregated
 * collection
 * Display -to-one as a formatted field
 */
function RelationshipField({
  resource,
  field,
  id,
  name,
}: {
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly field: Relationship;
}): JSX.Element {
  const [formatted, setFormatted] = React.useState<string | false | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (resource === undefined) return undefined;
    let destructorCalled = false;
    const handleChange = (): void =>
      void fetchPathAsString(resource, [field])
        .then((value) =>
          destructorCalled ? undefined : setFormatted(value ?? false)
        )
        .catch(raise);

    const destructor = resourceOn(
      resource,
      `change:${field.name}`,
      handleChange,
      true
    );
    return (): void => {
      destructor();
      destructorCalled = true;
    };
  }, [resource, field]);

  return (
    <Input.Text
      id={id}
      isReadOnly
      name={name}
      value={
        formatted === undefined
          ? commonText.loading()
          : formatted === false
            ? ''
            : formatted.toString()
      }
    />
  );
}

function Field({
  resource,
  id,
  name,
  field,
  parser: defaultParser,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly field: LiteralField | undefined;
  readonly parser?: Parser;
}): JSX.Element {
  const { value, updateValue, validationRef, parser } = useResourceValue(
    resource,
    field,
    defaultParser
  );

  /*
   * REFACTOR: consider moving this into useResoruceValue
   *    (it will be added to parser)
   */
  const isInSearchDialog = React.useContext(SearchDialogContext);
  const isReadOnly =
    React.useContext(ReadOnlyContext) ||
    (field?.isReadOnly === true && !isInSearchDialog);

  const validationAttributes = getValidationAttributes(parser);

  const [rightAlignNumberFields] = userPreferences.use(
    'form',
    'ui',
    'rightAlignNumberFields'
  );

  const isNew = resource?.isNew();
  const isCO = resource?.specifyTable.name === 'CollectionObject';
  const isPartOfCOG = isCO
    ? resource?.get('cojo') !== null && resource?.get('cojo') !== undefined
    : false;
  const isCatNumberField = field?.name === 'catalogNumber';
  // Check if collection pref wants to inherit primary cat num for empty CO cat num sibilings inside of a COG
  const [displayPrimaryCatNumberPref] = collectionPreferences.use(
    'catalogNumberInheritance',
    'behavior',
    'inheritance'
  );
  const displayCatNumberPlaceHolder =
    isNew === false &&
    isCO &&
    isPartOfCOG &&
    isCatNumberField &&
    displayPrimaryCatNumberPref;

  const [primaryCatalogNumber, setPrimaryCatalogNumber] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    if (resource && displayCatNumberPlaceHolder) {
      ajax<string | null>('/api/specify/catalog_number_for_sibling/', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: resource,
      })
        .then((response) => {
          setPrimaryCatalogNumber(response.data);
        })
        .catch((error) => {
          console.error('Error fetching catalog number:', error);
        });
    }
  }, [resource, displayCatNumberPlaceHolder]);

  return (
    <Input.Generic
      forwardRef={validationRef}
      key={parser.title}
      name={name}
      placeholder={
        displayCatNumberPlaceHolder && typeof primaryCatalogNumber === 'string'
          ? primaryCatalogNumber
          : undefined
      }
      {...validationAttributes}
      className={
        /*
         * Disable "text-align: right" in non webkit browsers
         * as they don't support spinner's arrow customization
         */
        parser.type === 'number' &&
        rightAlignNumberFields &&
        globalThis.navigator.userAgent.toLowerCase().includes('webkit')
          ? `text-right ${isReadOnly ? '' : 'pr-6'}`
          : ''
      }
      id={id}
      isReadOnly={isReadOnly}
      required={'required' in validationAttributes && !isInSearchDialog}
      tabIndex={isReadOnly ? -1 : undefined}
      value={value?.toString() ?? ''}
      onBlur={
        isReadOnly ? undefined : ({ target }): void => updateValue(target.value)
      }
      onValueChange={(value): void => updateValue(value, false)}
      /*
       * Update data model value before onBlur, as onBlur fires after onSubmit
       * if form is submitted using the ENTER key
       */
      onChange={(event): void => {
        const input = event.target as HTMLInputElement;
        /*
         * Don't show validation errors on value change for input fields until
         * field is blurred, unless user tried to paste a date (see definition
         * of Input.Generic)
         */
        updateValue(input.value, event.type === 'paste');
      }}
    />
  );
}
