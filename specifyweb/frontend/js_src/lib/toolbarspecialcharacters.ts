import type { View } from 'backbone';

import commonText from './localization/common';

let specialCharacterView: View | undefined = undefined;

const getSpecialCharacterView = async (): Promise<View> =>
  typeof specialCharacterView === 'undefined'
    ? import('./components/specialcharacters').then((specialCharacters) => {
        specialCharacterView = specialCharacters as unknown as View;
        return specialCharacterView;
      })
    : Promise.resolve(specialCharacterView);

const toolbarSpecialCharacters = {
  task: 'specialcharacters',
  title: commonText('specialCharacters'),
  // eslint-disable-next-line unicorn/no-null
  icon: null,
  execute: () =>
    getSpecialCharacterView().then((SpecialCharacterView) =>
      new (SpecialCharacterView as any).default().render()
    ),
  disabled: false,
};

export default toolbarSpecialCharacters;
