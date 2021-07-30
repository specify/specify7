'use strict';

import router from './router';

export default function () {
  router.route('', 'welcome', function () {
    import('./welcomeview').then(({default: WelcomeView}) => WelcomeView());
  });
};
