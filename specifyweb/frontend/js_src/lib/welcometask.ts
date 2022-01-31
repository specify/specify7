import { router } from './router';
import * as app from './specifyapp';

export default function () {
  router.route('', 'welcome', function () {
    import('./components/welcomeview').then(({ default: WelcomeView }) =>
      app.setCurrentView(new WelcomeView({}))
    );
  });
}
