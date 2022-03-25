import React from 'react';

import commonText from '../../localization/common';
import type { GenericPreferencesCategories } from '../../preferences';
import { preferenceDefinitions } from '../../preferences';
import { Button, Container, Form, H2, H3, Submit } from '../basic';
import { useId, useTitle } from '../hooks';
import type { UserTool } from '../main';
import createBackboneView from '../reactbackboneextend';
import { LoadingContext } from '../contexts';

function Preferences({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('preferences'));

  const [changesMade, _setChangesMade] = React.useState(false);

  const loading = React.useContext(LoadingContext);
  const id = useId('preferences');

  return (
    <Container.Full>
      <H2>{commonText('preferences')}</H2>
      <Form
        className="flex flex-col flex-1 gap-6 overflow-y-auto"
        id={id('form')}
        onSubmit={(): void =>
          // TODO: save changes
          loading(Promise.resolve())
        }
      >
        {Object.entries(
          preferenceDefinitions as GenericPreferencesCategories
        ).map(
          ([category, { title, description = undefined, subCategories }]) => (
            <section key={category} className="flex flex-col gap-4">
              <H3>{title}</H3>
              {typeof description === 'string' && <p>{description}</p>}
              {Object.entries(subCategories).map(
                ([subcategory, { title, description = undefined, items }]) => (
                  <section key={subcategory} className="flex flex-col gap-2">
                    <h4>{title}</h4>
                    {typeof description === 'string' && <p>{description}</p>}
                    {Object.entries(items).map(([name, item]) => (
                      <label key={name} className="flex gap-2">
                        <p>{item.title}</p>
                        <div className="flex flex-col gap-1">
                          {typeof item.description === 'string' && (
                            <p>{item.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </section>
                )
              )}
            </section>
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

const PreferencesView = createBackboneView(Preferences);

const toolBarItem: UserTool = {
  task: 'preferences',
  title: commonText('preferences'),
  isOverlay: false,
  view: ({ onClose }) => new PreferencesView({ onClose }),
  groupLabel: commonText('customization'),
};

export default toolBarItem;
