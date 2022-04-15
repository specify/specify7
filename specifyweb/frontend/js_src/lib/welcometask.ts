import { router } from './router';
import { setCurrentView } from './specifyapp';

export function task() {
  router.route('', 'welcome', function () {
    import('./components/welcomeview').then(({ WelcomeView }) =>
      setCurrentView(new WelcomeView({}))
    );
  });
}
