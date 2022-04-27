/**
 * Localization strings used in the Tree Viewer
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const treeText = createDictionary({
  badStructure: {
    'en-us': 'Bad tree structure.',
    'ru-ru': 'У дерева плохая структура.',
    ca: 'Bad tree structure.',
    'es-es': 'Bad tree structure.',
  },
  // TreeContextMenu
  merge: {
    'en-us': 'Merge',
    'ru-ru': 'Объединить',
    ca: 'Merge',
    'es-es': 'Merge',
  },
  undoSynonymy: {
    'en-us': 'Undo Synonymy',
    'ru-ru': 'Отменить синонимию',
    ca: 'Undo Synonymy',
    'es-es': 'Undo Synonymy',
  },
  synonymize: {
    'en-us': 'Synonymize',
    'ru-ru': 'Сделать синонимом',
    ca: 'Synonymize',
    'es-es': 'Synonymize',
  },
  actionFailedDialogTitle: {
    'en-us': 'Operation failed',
    'ru-ru': 'Операция провалена',
    ca: 'Operation failed',
    'es-es': 'Operation failed',
  },
  actionFailedDialogHeader: {
    'en-us': 'Operation failed',
    'ru-ru': 'Операция провалена',
    ca: 'Operation failed',
    'es-es': 'Operation failed',
  },
  actionFailedDialogMessage: {
    'en-us':
      'The operation could not be completed due to the following errors:',
    'ru-ru': 'Операция не может быть завершена из-за следующих ошибок:',
    ca: 'The operation could not be completed due to the following errors:',
    'es-es':
      'The operation could not be completed due to the following errors:',
  },
  moveNode: {
    'en-us': 'Move node',
    'ru-ru': 'Переместить',
    ca: 'Move node',
    'es-es': 'Move node',
  },
  moveNodeHere: {
    'en-us': (nodeName: string) => `Move "${nodeName}" here`,
    'ru-ru': (nodeName: string) => `Переместите «${nodeName}» сюда`,
    ca: (nodeName: string) => `Move "${nodeName}" here`,
    'es-es': (nodeName: string) => `Move "${nodeName}" here`,
  },
  nodeMoveMessage: {
    'en-us': (treeName: string, nodeName: string, parentName: string) => `
      The ${treeName} node "${nodeName}" will be placed, along with
      all of its descendants, under the new parent "${parentName}".`,
    'ru-ru': (treeName: string, nodeName: string, parentName: string) => `
      «${nodeName}» (${treeName}) будет размещен вместе со всеми его
      дочерними элементами, под новым родительским элементом
      ${parentName}.`,
    ca: (treeName: string, nodeName: string, parentName: string) => `
      The ${treeName} node "${nodeName}" will be placed, along with
      all of its descendants, under the new parent "${parentName}".`,
    'es-es': (treeName: string, nodeName: string, parentName: string) => `
      The ${treeName} node "${nodeName}" will be placed, along with
      all of its descendants, under the new parent "${parentName}".`,
  },
  nodeMoveHintMessage: {
    'en-us': (nodeName: string) =>
      `Select a new parent for "${nodeName}" and press the button.`,
    'ru-ru': (nodeName: string) =>
      `Выберите нового родителя для «${nodeName}» и нажмите на кнопку.`,
    ca: (nodeName: string) =>
      `Select a new parent for "${nodeName}" and press the button.`,
    'es-es': (nodeName: string) =>
      `Select a new parent for "${nodeName}" and press the button.`,
  },
  mergeNode: {
    'en-us': 'Merge node',
    'ru-ru': 'Объединить',
    ca: 'Merge node',
    'es-es': 'Merge node',
  },
  mergeNodeHere: {
    'en-us': (nodeName: string) => `Merge "${nodeName}" here`,
    'ru-ru': (nodeName: string) => `Объедините «${nodeName}» здесь`,
    ca: (nodeName: string) => `Merge "${nodeName}" here`,
    'es-es': (nodeName: string) => `Merge "${nodeName}" here`,
  },
  mergeNodeHintMessage: {
    'en-us': (nodeName: string) =>
      `Select a new target for "${nodeName}" to be merged into and press the button`,
    'ru-ru': (nodeName: string) =>
      `Выберите новый пункт назначения для слияния «${nodeName}А» и нажмите на кнопку`,
    ca: (nodeName: string) =>
      `Select a new target for "${nodeName}" to be merged into and press the button`,
    'es-es': (nodeName: string) =>
      `Select a new target for "${nodeName}" to be merged into and press the button`,
  },
  mergeNodeMessage: {
    'en-us': (treeName: string, nodeName: string, parentName: string) => `
      All references to ${treeName} node "${nodeName}" will be replaced
      with "${parentName}", and all descendants of "${nodeName}"
      will be moved to "${parentName}" with any descendants matching
      in name and rank being themselves merged recursively.`,
    'ru-ru': (treeName: string, nodeName: string, parentName: string) => `
      Все ссылки на "${nodeName}" (${treeName}) будут заменены
      с "${parentName}", и все потомки "${nodeName}"
      будет перемещен в "${parentName}" с соответствующими потомками
      по названию и рангу подвергнется рекурсивному слиянию.`,
    ca: (treeName: string, nodeName: string, parentName: string) => `
      All references to ${treeName} node "${nodeName}" will be replaced
      with "${parentName}", and all descendants of "${nodeName}"
      will be moved to "${parentName}" with any descendants matching
      in name and rank being themselves merged recursively.`,
    'es-es': (treeName: string, nodeName: string, parentName: string) => `
      All references to ${treeName} node "${nodeName}" will be replaced
      with "${parentName}", and all descendants of "${nodeName}"
      will be moved to "${parentName}" with any descendants matching
      in name and rank being themselves merged recursively.`,
  },
  synonymizeNode: {
    'en-us': 'Synonymize node',
    'ru-ru': 'Синонимизировать',
    ca: 'Synonymize node',
    'es-es': 'Synonymize node',
  },
  makeSynonym: {
    'en-us': (nodeName: string, synonymName: string) =>
      `Make ${nodeName} a synonym of ${synonymName}`,
    'ru-ru': (nodeName: string, synonymName: string) =>
      `Сделайте ${nodeName} синонимом ${synonymName}`,
    ca: (nodeName: string, synonymName: string) =>
      `Make ${nodeName} a synonym of ${synonymName}`,
    'es-es': (nodeName: string, synonymName: string) =>
      `Make ${nodeName} a synonym of ${synonymName}`,
  },
  synonymizeNodeHintMessage: {
    'en-us': (nodeName: string) =>
      `Select a target for "${nodeName}" to be synonymized to and press the button`,
    'ru-ru': (nodeName: string) =>
      `Выберите цель, синонимом которой будет «${nodeName}», и нажмите кнопку`,
    ca: (nodeName: string) =>
      `Select a target for "${nodeName}" to be synonymized to and press the button`,
    'es-es': (nodeName: string) =>
      `Select a target for "${nodeName}" to be synonymized to and press the button`,
  },
  synonymizeMessage: {
    'en-us': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node "${nodeName}" will be made a synonym
      of "${synonymName}".`,
    'ru-ru': (treeName: string, nodeName: string, synonymName: string) =>
      `Узел «${nodeName}» (${treeName}) станет синонимом
      «${synonymName}».`,
    ca: (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node "${nodeName}" will be made a synonym
      of "${synonymName}".`,
    'es-es': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node "${nodeName}" will be made a synonym
      of "${synonymName}".`,
  },
  desynonymizeNode: {
    'en-us': 'Desynonymize node',
    'ru-ru': 'Отменить синонимизацию',
    ca: 'Desynonymize node',
    'es-es': 'Desynonymize node',
  },
  desynonymizeNodeMessage: {
    'en-us': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node "${nodeName}" will no longer be a
      synonym of "${synonymName}".`,
    'ru-ru': (treeName: string, nodeName: string, synonymName: string) =>
      `Узел «${nodeName}» (${treeName}) больше не будет синонимом «${synonymName}».`,
    ca: (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node "${nodeName}" will no longer be a
      synonym of "${synonymName}".`,
    'es-es': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node "${nodeName}" will no longer be a
      synonym of "${synonymName}".`,
  },
  // TreeNodeView
  acceptedName: {
    'en-us': 'Preferred:',
    'ru-ru': 'Предпочтительний:',
    ca: 'Preferred:',
    'es-es': 'Preferred:',
  },
  // TreeView
  treeViewTitle: {
    'en-us': (treeName: string) => `${treeName} Tree`,
    'ru-ru': (treeName: string) => `${treeName} Дерево`,
    ca: (treeName: string) => `${treeName} Tree`,
    'es-es': (treeName: string) => `${treeName} Tree`,
  },
  searchTreePlaceholder: {
    'en-us': 'Search Tree',
    'ru-ru': 'Поиск',
    ca: 'Search Tree',
    'es-es': 'Search Tree',
  },
  opened: {
    'en-us': 'Opened',
    'ru-ru': 'Открыт',
    ca: 'Opened',
    'es-es': 'Opened',
  },
  closed: {
    'en-us': 'Closed',
    'ru-ru': 'Закрыт',
    ca: 'Closed',
    'es-es': 'Closed',
  },
  leafNode: {
    'en-us': 'Leaf Node',
    'ru-ru': 'Угловой узел',
    ca: 'Leaf Node',
    'es-es': 'Leaf Node',
  },
  directCollectionObjectCount: {
    'en-us': 'Direct Collection Object Count',
    'ru-ru': 'Количество прямых объектов коллекции',
    ca: "Recompte d'objectes de col·lecció directa",
    'es-es': 'Direct Collection Object Count',
  },
  indirectCollectionObjectCount: {
    'en-us': 'Indirect Collection Object Count',
    'ru-ru': 'Количество непрямых объектов коллекции',
    ca: "Recompte d'objectes de col·lecció indirecta",
    'es-es': 'Indirect Collection Object Count',
  },
  editRanks: {
    'en-us': 'Edit Ranks',
    'ru-ru': 'Изменить ранги',
    ca: 'Edit Ranks',
    'es-es': 'Edit Ranks',
  },
});
