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

const primaryCatalogNumberCache = new Map<number, string>();
const parentCatalogNumberCache = new Map<number, string>();

type CatalogNumberInheritanceMetadata = {
  readonly _catalogNumberInheritancePending?: boolean;
};

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
  const PRIMARY_PLACEHOLDER_MAX_RETRIES = 5;
  const PRIMARY_PLACEHOLDER_RETRY_DELAY = 750;

  const isNew = resource?.isNew();
  const isCO = resource?.specifyTable.name === 'CollectionObject';
  const isComponent = resource?.specifyTable.name === 'Component';

  const inheritanceMetadata = resource as CatalogNumberInheritanceMetadata &
    SpecifyResource<AnySchema>;
  const cojoMembership = resource?.get('cojo');
  const isPartOfCOG =
    isCO &&
    (resource?.get('isMemberOfCOG') === true ||
      (cojoMembership !== null && cojoMembership !== undefined));
  const isPendingCatalogNumberInheritance =
    inheritanceMetadata?._catalogNumberInheritancePending === true;

  const hasCOParent =
    isComponent &&
    resource?.get('collectionObject') !== null &&
    resource?.get('collectionObject') !== undefined;

  const isCatNumberField = field?.name === 'catalogNumber';

  const [displayPrimaryCatNumberPref] = collectionPreferences.use(
    'catalogNumberInheritance',
    'behavior',
    'inheritance'
  );

  const [displayParentCatNumberPref] = collectionPreferences.use(
    'catalogNumberParentInheritance',
    'behavior',
    'inheritance'
  );

  const shouldShowPrimaryCatalogPlaceholder =
    isCatNumberField &&
    displayPrimaryCatNumberPref &&
    (isPartOfCOG || isPendingCatalogNumberInheritance);

  const shouldShowParentCatalogPlaceholder =
    isComponent &&
    hasCOParent &&
    isCatNumberField &&
    displayParentCatNumberPref;

  const shouldSkipCatalogNumberDefault =
    isNew === true && shouldShowPrimaryCatalogPlaceholder;

  React.useEffect(() => {
    if (
      isPartOfCOG &&
      inheritanceMetadata?._catalogNumberInheritancePending === true
    )
      delete inheritanceMetadata._catalogNumberInheritancePending;
  }, [isPartOfCOG, inheritanceMetadata]);

  const { value, updateValue, validationRef, parser } = useResourceValue(
    resource,
    field,
    defaultParser,
    {
      skipParserDefaultValue: shouldSkipCatalogNumberDefault,
    }
  );

  /*
   * REFACTOR: consider moving this into useResoruceValue
   *    (it will be added to parser)
   */
  const isInSearchDialog = React.useContext(SearchDialogContext);
  const isReadOnly =
    React.useContext(ReadOnlyContext) ||
    (field?.isReadOnly === true && !isInSearchDialog);

  const [primaryCatalogNumber, setPrimaryCatalogNumber] = React.useState<
    string | null
  >(() =>
    typeof resource?.id === 'number'
      ? (primaryCatalogNumberCache.get(resource.id) ?? null)
      : null
  );

  const [parentCatalogNumber, setParentCatalogNumber] = React.useState<
    string | null
  >(() =>
    typeof resource?.id === 'number'
      ? (parentCatalogNumberCache.get(resource.id) ?? null)
      : null
  );

  const displayPrimaryCatNumberPlaceHolder =
    shouldShowPrimaryCatalogPlaceholder ||
    typeof primaryCatalogNumber === 'string';

  const displayParentCatNumberPlaceHolder = shouldShowParentCatalogPlaceholder;

  const validationAttributes = getValidationAttributes(parser);
  const { placeholder: parserPlaceholder, ...inputValidationAttributes } =
    validationAttributes;
  const rightAlignClassName = useRightAlignClassName(parser.type, isReadOnly);

  const [primaryPlaceholderRetryCount, setPrimaryPlaceholderRetryCount] =
    React.useState(0);
  const primaryPlaceholderRetryTimeout = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  React.useEffect(() => {
    primaryPlaceholderRetryTimeout.current === undefined
      ? undefined
      : globalThis.clearTimeout(primaryPlaceholderRetryTimeout.current);
    return () => {
      primaryPlaceholderRetryTimeout.current === undefined
        ? undefined
        : globalThis.clearTimeout(primaryPlaceholderRetryTimeout.current);
    };
  }, []);

  React.useEffect(() => {
    if (!displayPrimaryCatNumberPlaceHolder) return;
    setPrimaryPlaceholderRetryCount((current) => (current === 0 ? current : 0));
  }, [resource?.id, displayPrimaryCatNumberPlaceHolder]);

  React.useEffect(() => {
    if (
      isCatNumberField &&
      isNew === true &&
      displayPrimaryCatNumberPref &&
      (isPartOfCOG || isPendingCatalogNumberInheritance) &&
      typeof parser.value === 'string' &&
      resource?.get('catalogNumber') === parser.value
    )
      resource?.unset?.('catalogNumber', { silent: true });
  }, [
    resource,
    isCatNumberField,
    isNew,
    displayPrimaryCatNumberPref,
    isPartOfCOG,
    isPendingCatalogNumberInheritance,
    parser.value,
  ]);

  React.useEffect(() => {
    const shouldRequestPrimaryCatalogNumber =
      resource !== undefined &&
      resource.id !== undefined &&
      isCatNumberField &&
      displayPrimaryCatNumberPref;

    if (shouldRequestPrimaryCatalogNumber) {
      const requestPayload = { id: resource.id };
      ajax<string | null>('/inheritance/catalog_number_for_sibling/', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: requestPayload,
      })
        .then((response) => {
          if (
            response.data === null &&
            primaryPlaceholderRetryCount < PRIMARY_PLACEHOLDER_MAX_RETRIES
          ) {
            primaryPlaceholderRetryTimeout.current = globalThis.setTimeout(
              () => setPrimaryPlaceholderRetryCount((value) => value + 1),
              PRIMARY_PLACEHOLDER_RETRY_DELAY
            );
            return;
          }
          setPrimaryCatalogNumber(response.data);
          if (typeof resource?.id === 'number')
            if (typeof response.data === 'string')
              primaryCatalogNumberCache.set(resource.id, response.data);
            else primaryCatalogNumberCache.delete(resource.id);
        })
        .catch((error) => {
          console.error('Error fetching catalog number:', error);
        });
    } else if (
      resource &&
      displayParentCatNumberPlaceHolder &&
      resource.id !== undefined
    ) {
      const requestPayload = { id: resource.id };
      ajax<string | null>('/inheritance/catalog_number_from_parent/', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: requestPayload,
      })
        .then((response) => {
          setParentCatalogNumber(response.data);
          if (typeof resource?.id === 'number')
            if (typeof response.data === 'string')
              parentCatalogNumberCache.set(resource.id, response.data);
            else parentCatalogNumberCache.delete(resource.id);
        })
        .catch((error) => {
          console.error('Error fetching catalog number:', error);
        });
    }
  }, [
    resource,
    resource?.id,
    cojoMembership,
    isCatNumberField,
    displayPrimaryCatNumberPref,
    primaryPlaceholderRetryCount,
    displayPrimaryCatNumberPlaceHolder,
    displayParentCatNumberPlaceHolder,
  ]);

  const defaultPlaceholder = isCatNumberField ? undefined : parserPlaceholder;
  const placeholder = displayPrimaryCatNumberPlaceHolder
    ? typeof primaryCatalogNumber === 'string'
      ? primaryCatalogNumber
      : undefined
    : displayParentCatNumberPlaceHolder
      ? typeof parentCatalogNumber === 'string'
        ? parentCatalogNumber
        : undefined
      : defaultPlaceholder;

  return (
    <Input.Generic
      forwardRef={validationRef}
      key={parser.title}
      max={Number.MAX_SAFE_INTEGER}
      name={name}
      placeholder={placeholder}
      {...inputValidationAttributes}
      className={rightAlignClassName}
      id={id}
      isReadOnly={isReadOnly}
      required={'required' in inputValidationAttributes && !isInSearchDialog}
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

export function useRightAlignClassName(
  type: Parser['type'],
  isReadOnly: boolean
): string | undefined {
  const [rightAlignNumberFields] = userPreferences.use(
    'form',
    'ui',
    'rightAlignNumberFields'
  );

  /*
   * Disable "text-align: right" in non webkit browsers
   * as they don't support spinner's arrow customization
   */
  return type === 'number' &&
    rightAlignNumberFields &&
    globalThis.navigator.userAgent.toLowerCase().includes('webkit')
    ? `text-right ${isReadOnly ? '' : 'pr-6'}`
    : '';
}
