/**
 * Edit user preferences
 */

import React from 'react';

import { f } from '../../functools';
import { commonText } from '../../localization/common';
import type {
  GenericPreferencesCategories,
  PreferenceItem,
  PreferenceItemComponent,
} from '../../preferences';
import { preferenceDefinitions } from '../../preferences';
import { awaitPrefsSynced, setPref } from '../../preferencesutils';
import { getValidationAttributes, parseValue } from '../../uiparse';
import {
  Button,
  className,
  Container,
  Form,
  H2,
  Input,
  Select,
  Submit,
} from '../basic';
import { LoadingContext } from '../contexts';
import { useBooleanState, useId, useTitle, useValidation } from '../hooks';
import type { UserTool } from '../main';
import { usePref } from '../preferenceshooks';
import { createBackboneView } from '../reactbackboneextend';
import { preferencesText } from '../../localization/preferences';
import { icons } from '../icons';

// TODO: add reset to default button
function Preferences({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('preferences'));

  const [changesMade, handleChangesMade] = useBooleanState();
  const [needsRestart, handleRestartNeeded] = useBooleanState();

  const loading = React.useContext(LoadingContext);
  const id = useId('preferences');

  // Hide invisible preferences. Remote empty categories and subCategories
  const definitions = Object.entries(
    preferenceDefinitions as GenericPreferencesCategories
  )
    .map(
      ([category, { subCategories, ...categoryData }]) =>
        [
          category,
          {
            ...categoryData,
            subCategories: Object.entries(subCategories)
              .map(
                ([subCategory, { items, ...subCategoryData }]) =>
                  [
                    subCategory,
                    {
                      ...subCategoryData,
                      items: Object.entries(items)
                        // FIXME: check for permissions for adminsOnly
                        .filter(
                          ([_name, { visible }]) =>
                            visible === true || visible === 'adminsOnly'
                        ),
                    },
                  ] as const
              )
              .filter(([_name, { items }]) => items.length > 0),
          },
        ] as const
    )
    .filter(([_name, { subCategories }]) => subCategories.length > 0);

  return (
    <Container.Full>
      <H2>{commonText('preferences')}</H2>
      <Form
        className="flex flex-col flex-1 gap-6 overflow-y-auto"
        id={id('form')}
        onSubmit={(): void =>
          loading(
            awaitPrefsSynced().then(() =>
              needsRestart ? window.location.assign('/') : handleClose()
            )
          )
        }
      >
        {definitions.map(
          ([category, { title, description = undefined, subCategories }]) => (
            <Container.Base key={category} className="gap-8">
              <h3 className="text-2xl">{title}</h3>
              {typeof description === 'string' && <p>{description}</p>}
              {subCategories.map(
                ([subcategory, { title, description = undefined, items }]) => (
                  <section key={subcategory} className="flex flex-col gap-4">
                    <div className="flex">
                      <span className="flex-1" />
                      <h4 className={`${className.headerGray} text-center`}>
                        {title}
                      </h4>
                      <div className="flex justify-end flex-1">
                        <Button.Blue
                          aria-label={preferencesText('resetToDefault')}
                          title={preferencesText('resetToDefault')}
                          className="!p-1"
                          onClick={(): void =>
                            items.forEach(([name, { defaultValue }]) =>
                              setPref(category, subcategory, name, defaultValue)
                            )
                          }
                        >
                          {icons.refresh}
                        </Button.Blue>
                      </div>
                    </div>
                    {typeof description === 'string' && <p>{description}</p>}
                    {items.map(([name, item]) => (
                      <label key={name} className="flex items-start gap-2">
                        <div className="flex flex-col flex-1 gap-2">
                          <p
                            className={`flex items-center justify-end flex-1
                              text-right min-h-[theme(spacing.8)]`}
                          >
                            {item.title}
                          </p>
                          {typeof item.description === 'string' && (
                            <p className="flex justify-end flex-1 text-right text-gray-500">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div
                          className={`flex flex-col justify-center flex-1 gap-2
                            min-h-[theme(spacing.8)]`}
                        >
                          <Item
                            item={item}
                            category={category}
                            subcategory={subcategory}
                            name={name}
                            onChanged={handleChangesMade}
                            onRestartNeeded={handleRestartNeeded}
                          />
                        </div>
                      </label>
                    ))}
                  </section>
                )
              )}
            </Container.Base>
          )
        )}
      </Form>
      <nav>
        {changesMade ? (
          <>
            <Button.Gray onClick={handleClose}>
              {commonText('cancel')}
            </Button.Gray>
            <Submit.Blue form={id('form')}>{commonText('save')}</Submit.Blue>
          </>
        ) : (
          <Button.Gray onClick={(): void => history.back()}>
            {commonText('close')}
          </Button.Gray>
        )}
      </nav>
    </Container.Full>
  );
}

function Item({
  item,
  category,
  subcategory,
  name,
  onChanged: handleChanged,
  onRestartNeeded: handleRestartNeeded,
}: {
  readonly item: PreferenceItem<any>;
  readonly category: string;
  readonly subcategory: string;
  readonly name: string;
  readonly onChanged: () => void;
  readonly onRestartNeeded: () => void;
}): JSX.Element {
  const Renderer = 'renderer' in item ? item.renderer : DefaultRenderer;
  const [value, setValue] = usePref(category, subcategory, name);
  return (
    <Renderer
      definition={item}
      value={value}
      onChange={(value): void => {
        if (item.requiresReload) handleRestartNeeded();
        handleChanged();
        (item.onChange ?? setValue)(value);
      }}
    />
  );
}

const DefaultRenderer: PreferenceItemComponent<any> = function ({
  definition,
  value,
  onChange: handleChange,
}) {
  const parser = 'parser' in definition ? definition.parser : undefined;
  const validationAttributes = React.useMemo(
    () => f.maybe(parser, getValidationAttributes),
    [parser]
  );
  const { validationRef, inputRef, setValidation } = useValidation();
  return 'values' in definition ? (
    <>
      <Select value={value} onChange={handleChange}>
        {definition.values.map(({ value, title }) => (
          <option key={value} value={value}>
            {title}
          </option>
        ))}
      </Select>
      {f.maybe(
        definition.values.find((item) => item.value === value).description,
        (item) => (
          <p>{item}</p>
        )
      )}
    </>
  ) : parser?.type === 'checkbox' ? (
    <Input.Checkbox checked={value} onValueChange={handleChange} />
  ) : (
    <Input.Generic
      forwardRef={validationRef}
      {...(validationAttributes ?? { type: 'text' })}
      value={value}
      onValueChange={(newValue): void => {
        if (typeof parser === 'object' && inputRef.current !== null) {
          const parsed = parseValue(parser, inputRef.current, newValue);
          if (parsed.isValid) handleChange(newValue);
          else setValidation(parsed.reason);
        } else handleChange(newValue);
      }}
    />
  );
};
const PreferencesView = createBackboneView(Preferences);
export const userTool: UserTool = {
  task: 'preferences',
  title: commonText('preferences'),
  isOverlay: false,
  view: ({ onClose }) => new PreferencesView({ onClose }),
  groupLabel: commonText('customization'),
};
