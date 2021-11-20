import * as React from 'react';
import commonText from '../localization/common';
import { closeDialog, LoadingScreen, ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { IR } from './wbplanview';

function ChangeLanguage() {
  const [languages, setLanguages] = React.useState<
    | undefined
    | IR<{
        name_local: string;
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
      <label>
        {commonText('language')}
        <br />
        <select
          value={document.documentElement.lang}
          onChange={({ target }) =>
            fetch(`/context/language/${target.value}`)
              .then(()=>window.location.reload())
              .catch(console.error)
          }
        >
          {Object.entries(languages).map(([code, { name_local }]) => (
            <option key={code} value={code}>
              {name_local}
            </option>
          ))}
        </select>
      </label>
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
    new View().render();
  },
};
