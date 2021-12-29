import router from './router';

export default function () {
  router.route('tree/:table/', 'tree', (table: string) =>
    import('./treeview').then(({ default: treeView }) => treeView(table))
  );
}
