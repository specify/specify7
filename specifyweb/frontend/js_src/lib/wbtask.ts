import { router } from './router';
import { crash } from './components/errorboundary';
import { f } from './wbplanviewhelper';

export default function (): void {
  router.route(
    'workbench/:id/',
    'workbench',
    (id: string): void =>
      void f
        .all({
          wbView: import('./wbview'),
          treeRanks: import('./treedefinitions').then(
            ({ fetchTreeRanks }) => fetchTreeRanks
          ),
        })
        .then(({ wbView: { default: wbView } }) => wbView(Number.parseInt(id)))
        .catch(crash)
  );
}
