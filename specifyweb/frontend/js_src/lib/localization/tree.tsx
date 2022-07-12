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
  },
  // TreeContextMenu
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
  actionFailedDialogHeader: {
    'en-us': 'Operation failed',
    'ru-ru': 'Операция провалена',
  },
  actionFailedDialogText: {
    'en-us':
      'The operation could not be completed due to the following errors:',
    'ru-ru': 'Операция не может быть завершена из-за следующих ошибок:',
  },
  moveNode: {
    'en-us': 'Move node',
    'ru-ru': 'Переместить',
  },
  moveNodeHere: {
    'en-us': (nodeName: string) => `Move "${nodeName}" here`,
    'ru-ru': (nodeName: string) => `Переместите «${nodeName}» сюда`,
  },
  nodeMoveMessage: {
    'en-us': (treeName: string, nodeName: string, parentName: string) => `
      The ${treeName} node "${nodeName}" will be placed, along with
      all of its descendants, under the new parent "${parentName}".`,
    'ru-ru': (treeName: string, nodeName: string, parentName: string) => `
      «${nodeName}» (${treeName}) будет размещен вместе со всеми его
      дочерними элементами, под новым родительским элементом
      ${parentName}.`,
  },
  cantMoveHere: {
    'en-us': "Can't move this tree node here",
    'ru-ru': 'Невозможно переместить этот узел в этот узел',
  },
  cantMergeHere: {
    'en-us': "Can't merge this tree node here",
    'ru-ru': 'Невозможно объединить этот узел в этот узел',
  },
  cantMoveToSynonym: {
    'en-us': "Can't move to a synonym",
    'ru-ru': 'Невозможно переместить в синоним',
  },
  cantMergeIntoSynonym: {
    'en-us': "Can't merge into synonyms",
    'ru-ru': 'Невозможно объединить в синонимы',
  },

  cantSynonymizeSynonym: {
    'en-us': "Can't synonymize with a synonym",
    'ru-ru': 'Невозможно сделать синонимом синонима',
  },
  nodeMoveHintMessage: {
    'en-us': (nodeName: string) => `Select a new parent for "${nodeName}"`,
    'ru-ru': (nodeName: string) => `Выберите нового родителя для «${nodeName}»`,
  },
  mergeNode: {
    'en-us': 'Merge node',
    'ru-ru': 'Объединить',
  },
  mergeNodeHere: {
    'en-us': (nodeName: string) => `Merge "${nodeName}" here`,
    'ru-ru': (nodeName: string) => `Объедините «${nodeName}» здесь`,
  },
  mergeNodeHintMessage: {
    'en-us': (nodeName: string) =>
      `Select a new target for "${nodeName}" to be merged into`,
    'ru-ru': (nodeName: string) =>
      `Выберите новый пункт назначения для слияния «${nodeName}А» `,
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
      `Select a target for "${nodeName}" to be synonymized to `,
    'ru-ru': (nodeName: string) =>
      `Выберите цель, синонимом которой будет «${nodeName}»`,
  },
  synonymizeMessage: {
    'en-us': (treeName: string, nodeName: string, synonymName: string) =>
      `The ${treeName} node "${nodeName}" will be made a synonym
      of "${synonymName}".`,
    'ru-ru': (treeName: string, nodeName: string, synonymName: string) =>
      `Узел «${nodeName}» (${treeName}) станет синонимом
      «${synonymName}».`,
  },
  desynonymizeNode: {
    'en-us': 'Desynonymize node',
    'ru-ru': 'Отменить синонимизацию',
  },
  desynonymizeNodeMessage: {
    'en-us': (nodeName: string, synonymName: string) =>
      `"${nodeName}" will no longer be a synonym of "${synonymName}".`,
    'ru-ru': (nodeName: string, synonymName: string) =>
      `«${nodeName}» больше не будет синонимом «${synonymName}».`,
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
  directCollectionObjectCount: {
    'en-us': 'Direct Collection Object Count',
    'ru-ru': 'Количество прямых объектов коллекции',
  },
  indirectCollectionObjectCount: {
    'en-us': 'Indirect Collection Object Count',
    'ru-ru': 'Количество непрямых объектов коллекции',
  },
  editRanks: {
    'en-us': 'Edit Ranks',
    'ru-ru': 'Изменить ранги',
  },
});
