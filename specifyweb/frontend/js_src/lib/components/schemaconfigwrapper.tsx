import React from 'react';

import commonText from '../localization/common';
import navigation from '../navigation';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { SchemaConfig } from './schemaconfig';
import type { IR, RA } from './wbplanview';
import csrfToken from '../csrftoken';

type ConstructorProps = IR<never>;
type Props = {
  readonly removeUnloadProtect: () => void;
  readonly setUnloadProtect: () => void;
};

function SchemaConfigWrapper({
  removeUnloadProtect,
  setUnloadProtect,
}: Props): JSX.Element {
  const [languages, setLanguages] = React.useState<RA<string> | undefined>(
    undefined
  );

  React.useEffect(() => {
    fetch('http://localhost/stored_query/ephemeral/', {
      headers: {
        'x-csrftoken': csrfToken!,
      },
      body: JSON.stringify({
        name: 'Schema Config Languages',
        contextname: 'SpLocaleItemStr',
        contexttableid: 500,
        selectdistinct: true,
        countonly: false,
        formatauditrecids: false,
        specifyuser: '/api/specify/specifyuser/1/',
        isfavorite: true,
        ordinal: 32_767,
        fields: [
          {
            sorttype: 0,
            isdisplay: true,
            isnot: false,
            startvalue: '',
            query: '/api/specify/spquery/',
            position: 0,
            tablelist: '505',
            stringid: '505.splocaleitemstr.language',
            fieldname: 'language',
            isrelfld: false,
            operstart: 1,
          },
        ],
        offset: 0,
      }),
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    })
      .then<{ readonly results: RA<string> }>((response) => response.json())
      .catch((error) => {
        console.error(error);
        return undefined;
      })
      .then((data) => {
        if (!destructorCalled) setLanguages(data?.results);
      })
      .catch(console.error);

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  });

  return typeof languages === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <SchemaConfig
      languages={languages}
      removeUnloadProtect={removeUnloadProtect}
      setUnloadProtect={setUnloadProtect}
    />
  );
}

const setUnloadProtect = (self: Props): void =>
  navigation.addUnloadProtect(self, commonText('unsavedSchemaUnloadProtect'));

const removeUnloadProtect = (self: Props): void =>
  navigation.removeUnloadProtect(self);

export default createBackboneView<ConstructorProps, Props, Props>({
  moduleName: 'WbPlanView',
  title: commonText('schemaConfig'),
  className: 'wbplanview content-no-shadow',
  remove(self) {
    removeUnloadProtect(self);
  },
  Component: SchemaConfigWrapper,
  getComponentProps: (self) => ({
    removeUnloadProtect: (): void => removeUnloadProtect(self),
    setUnloadProtect: (): void => setUnloadProtect(self),
  }),
});
