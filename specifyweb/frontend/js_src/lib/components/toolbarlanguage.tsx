import * as React from 'react';
import csrfToken from '../csrftoken';
import commonText from '../localization/common';
import { closeDialog, LoadingScreen, ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { IR } from './wbplanview';

function ChangeLanguage() {
  const [languages, setLanguages] = React.useState<
    | undefined
    | IR<{
        readonly name_local: string;
        readonly code: string;
      }>
  >(undefined);

  React.useEffect(() => {
    fetch('/context/languages/')
      .then((response) => response.json())
      .then(({ data }) => setLanguages(data))
      .catch(console.error);
  }, []);

  return typeof languages === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <ModalDialog
      properties={{
        title: commonText('changeLanguage'),
        buttons: {
          [commonText('close')]: closeDialog,
        },
      }}
    >
      <form action="/context/language/setlang/" method="post">
        <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken ?? ''} />
        <label>
          {commonText('language')}
          <br />
          <select
            name="language"
            value={document.documentElement.lang}
            onChange={({ target }) => target.closest('form')?.submit()}
          >
            {Object.entries(languages).map(
              ([code, { name_local, code: shortCode }]) => (
                <option key={code} value={code}>
                  {name_local} ({shortCode})
                </option>
              )
            )}
          </select>
        </label>
        <input type="submit" className="sr-only" />
      </form>
    </ModalDialog>
  );
}

const View = createBackboneView<IR<never>, IR<never>, IR<never>>({
  moduleName: 'ChangeLanguage',
  className: 'change-language',
  Component: ChangeLanguage,
  getComponentProps: (self) => ({
    dataset: self.dataset,
    onFinished: self.onFinished,
  }),
});

export default {
  task: 'change-language',
  title: commonText('changeLanguage'),
  execute: function () {
    // @ts-expect-error
    new View().render();
  },
};
