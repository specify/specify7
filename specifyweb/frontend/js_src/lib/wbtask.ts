import { router } from './router';
import { crash } from './components/errorboundary';
import { f } from './functools';

export function task(): void {
  router.route(
    'workbench/:id/',
    'workbench',
    (id: string): void =>
      void f
        .all({
          wbView: import('./wbview'),
          treeRanks: import('./treedefinitions').then(
            ({ treeRanksPromise }) => treeRanksPromise
          ),
        })
        .then(({ wbView: { loadDataset } }) => loadDataset(Number.parseInt(id)))
        .catch(crash)
  );
}
