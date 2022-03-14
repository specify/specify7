import React from 'react';

import commonText from '../../localization/common';
import type { GenericPreferencesCategories } from '../../preferences';
import { preferenceDefinitions } from '../../preferences';
import { Button, ContainerFull, Form, H2, Submit } from '../basic';
import { useId, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { LoadingScreen } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

function Preferences({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('preferences'));

  const [changesMade, setChangesMade] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const id = useId('preferences');

  return (
    <ContainerFull>
      <H2>{commonText('preferences')}</H2>
      {isLoading && <LoadingScreen />}
      <Form
        className="flex flex-col flex-1 gap-6 overflow-y-auto"
        id={id('form')}
        onSubmit={(event): void => {
          event.preventDefault();
          setIsLoading(true);
          // TODO: save changes
        }}
      >
        {Object.entries(
          preferenceDefinitions as GenericPreferencesCategories
        ).map(
          ([category, { title, description = undefined, subcategories }]) => (
            <section key={category} className="flex flex-col gap-4">
              <h3>{title}</h3>
              {typeof description === 'string' && <p>{description}</p>}
              {Object.entries(subcategories).map(
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
    </ContainerFull>
  );
}

const PreferencesView = createBackboneView(Preferences);

const toolBarItem: UserTool = {
  task: 'preferences',
  title: commonText('preferences'),
  isOverlay: false,
  view: ({ onClose }) => new PreferencesView({ onClose }),
};

export default toolBarItem;
