import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const treeText = createDictionary({
  badStructure: {
    'en-us': 'Bad tree structure.',
    'ru-ru': 'У дерева плохая структура.',
  },
  // TreeContextMenu
  cancelAction: {
    'en-us': 'Cancel action',
    'ru-ru': 'Отменить действие',
  },
  merge: {
    'en-us': 'Merge',
    'ru-ru': 'Объединить',
  },
  undoSynonymy: {
    'en-us': 'Undo Synonymy',
    'ru-ru': 'Отменить синонимию',
  },
  synonymize: {
    'en-us': 'Synonymize',
    'ru-ru': 'Сделать синонимом',
  },
  actionFailedDialogTitle: {
    'en-us': 'Operation failed',
    'ru-ru': 'Операция провалена',
  },
  actionFailedDialogHeader: {
    'en-us': createHeader('Operation failed'),
    'ru-ru': createHeader('Операция провалена'),
  },
  actionFailedDialogMessage: {
    'en-us':
      'The operation could not be completed due to the following errors:',
    'ru-ru': 'Операция не может быть завершена из-за следующих ошибок:',
  },
  moveNode: {
    'en-us': 'Move node',
    'ru-ru': 'Переместить',
  },
  moveNodeHere: {
    'en-us': (nodeName: string) => `Move ${nodeName} here`,
    'ru-ru': (nodeName: string) => `Переместите ${nodeName} сюда`,
  },
  nodeMoveMessage: {
    'en-us': (treeName: string, nodeName: string, parentName: string) => `
      The ${treeName} node <em>${nodeName}</em> will be placed, along with
      all of its descendants, under the new parent <em>${parentName}</em>.`,
    'ru-ru': (treeName: string, nodeName: string, parentName: string) => `
      <em>${nodeName}</em> (${treeName}) будет размещен вместе со всеми его
      дочерними элементами, под новым родительским элементом
      <em>${parentName}</em>.`,
  },
  nodeMoveHintMessage: {
    'en-us': (nodeName: string) =>
      `Right-click to select a new parent for <em>${nodeName}</em>.`,
    'ru-ru': (nodeName: string) =>
      `Щелкните правой кнопкой мыши, чтобы выбрать нового родителя для
      <em>${nodeName}</em>.`,
  },
  mergeNode: {
    'en-us': 'Merge node',
    'ru-ru': 'Объединить',
  },
  mergeNodeHere: {
    'en-us': (nodeName: string) => `Merge ${nodeName} here`,
    'ru-ru': (nodeName: string) => `Объедините ${nodeName} здесь`,
  },
  mergeNodeHintMessage: {
    'en-us': (nodeName: string) =>
      `Right-click to select a target for <em>${nodeName}</em> to be merged
    into.`,
    'ru-ru': (nodeName: string) =>
      `Щелкните правой кнопкой мыши, чтобы выбрать цель для объединения
      <em>${nodeName}</em>`,
  },
  mergeNodeMessage: {
    'en-us': (treeName: string, nodeName: string, parentName: string) => `
      All references to ${treeName} node <em>${nodeName}</em> will be replaced
      with <em>${parentName}</em>, and all descendants of <em>${nodeName}</em>
      will be moved to <em>${parentName}</em> with any descendants matching
      in name and rank being themselves merged recursively.`,
    'ru-ru': (treeName: string, nodeName: string, parentName: string) => `
      Все ссылки на <em>${nodeName}</em> (${treeName}) будут заменены
      с <em>${parentName}</em>, и все потомки <em>${nodeName}</em>
      будет перемещен в <em>${parentName}</em> с соответствующими потомками
      по названию и рангу подвергнется рекурсивному слиянию.`,
  },
  synonymizeNode: {
    'en-us': 'Synonymize node',
    'ru-ru': 'Синонимизировать',
  },
  makeSynonym: {
    'en-us': (nodeName: string, synonymName: string) =>
      `Make ${nodeName} a synonym of ${synonymName}`,
    'ru-ru': (nodeName: string, synonymName: string) =>
      `Сделайте ${nodeName} синонимом ${synonymName}`,
  },
  synonymizeNodeHintMessage: {
    'en-us': (nodeName: string) =>
      `Right-click to select a target for <em>${nodeName}</em> to be
      synonymized to.`,
    'ru-ru': (nodeName: string) =>
      `Щелкните правой кнопкой мыши, чтобы выбрать цель для синонимизирования
      <em>${nodeName}</em>.`,
  },
  synonymizeMessage: {
    'en-us': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node <em>${nodeName}</em> will be made a synonym
      of <em>${synonymName}</em>.`,
    'ru-ru': (treeName: string, nodeName: string, synonymName: string) =>
      `Узел <em>${nodeName}</em> (${treeName}) станет синонимом
      <em>${synonymName}</em>.`,
  },
  unsynonymizeNode: {
    'en-us': 'Unsynonymize node',
    'ru-ru': 'Отменить синонимизацию',
  },
  unsynonymizeNodeMessage: {
    'en-us': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node <em>${nodeName}</em> will no longer be a
      synonym of <em>${synonymName}</em>.`,
    'ru-ru': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node <em>${nodeName}</em> will no longer be a
      synonym of <em>${synonymName}</em>.`,
  },
  // TreeNodeView
  acceptedName: {
    'en-us': 'Preferred:',
    'ru-ru': 'Предпочтительний:',
  },
  // TreeView
  treeViewTitle: {
    'en-us': (treeName: string) => `${treeName} Tree`,
    'ru-ru': (treeName: string) => `${treeName} Дерево`,
  },
  searchTreePlaceholder: {
    'en-us': 'Search Tree',
    'ru-ru': 'Поиск',
  },
  remember: {
    'en-us': 'Remember',
    'ru-ru': 'Запомнить',
  },
  rememberButtonDescription: {
    'en-us': 'Save Tree Layout',
    'ru-ru': 'Сохранить макет дерева',
  },
  restore: {
    'en-us': 'Restore',
    'ru-ru': 'Восстановить',
  },
  restoreButtonDescription: {
    'en-us': 'Display Saved Tree Layout',
    'ru-ru': 'Показать сохраненный макет дерева',
  },
  forget: {
    'en-us': 'Forget',
    'ru-ru': 'Забыть',
  },
  forgetButtonDescription: {
    'en-us': 'Forget Saved Tree Layout',
    'ru-ru': 'Забыть о сохраненном макете дерева',
  },
  opened: {
    'en-us': 'Opened',
    'ru-ru': 'Открыт',
  },
  closed: {
    'en-us': 'Closed',
    'ru-ru': 'Закрыт',
  },
  leafNode: {
    'en-us': 'Leaf Node',
    'ru-ru': 'Угловой узел',
  },
});

export default treeText;
