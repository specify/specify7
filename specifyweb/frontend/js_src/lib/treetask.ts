import router from './router';

export default function () {
  router.route('tree/:table/', 'tree', async (table: string) =>
    import('./treeview').then(({ default: treeView }) => treeView(table))
  );
}
