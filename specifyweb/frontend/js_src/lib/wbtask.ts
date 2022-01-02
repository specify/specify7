import router from './router';

export default function (): void {
  router.route(
    'workbench/:id/',
    'workbench',
    (id: string): void =>
      void import('./wbview').then(({ default: wbView }) =>
        wbView(Number.parseInt(id))
      )
  );
}
