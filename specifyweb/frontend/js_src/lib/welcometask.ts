import { router } from './router';
import { setCurrentView } from './specifyapp';

export default function () {
  router.route('', 'welcome', function () {
    import('./components/welcomeview').then(({ default: WelcomeView }) =>
      setCurrentView(new WelcomeView({}))
    );
  });
}
