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
  move: {
    'en-us': 'Move',
    'ru-ru': 'Переместить',
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
  actionFailed: {
    'en-us': 'Operation failed',
    'ru-ru': 'Операция провалена',
  },
  actionFailedDescription: {
    'en-us':
      'The operation could not be completed due to the following errors:',
    'ru-ru': 'Операция не может быть завершена из-за следующих ошибок:',
  },
  moveNode: {
    'en-us': 'Move node',
    'ru-ru': 'Переместить',
  },
  addChild: {
    'en-us': 'Add Child',
    'ru-ru': 'Добавить Ребенка',
  },
  moveNodeHere: {
    'en-us': 'Move "{nodeName:string}" here',
    'ru-ru': 'Переместите «{nodeName:string}» сюда',
  },
  nodeMoveMessage: {
    'en-us': `
      The {treeName:string} node "{nodeName:string}" will be placed, along with
      all of its descendants, under the new parent "{parentName:string}".
    `,
    'ru-ru': `
      «{nodeName:string}» ({treeName:string}) будет размещен вместе со всеми его
      дочерними элементами, под новым родительским элементом
      {parentName:string}.
    `,
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
    'en-us': 'Select a new parent for "{nodeName:string}"',
    'ru-ru': 'Выберите нового родителя для «{nodeName:string}»',
  },
  mergeNode: {
    'en-us': 'Merge node',
    'ru-ru': 'Объединить',
  },
  mergeNodeHere: {
    'en-us': 'Merge "{nodeName:string}" here',
    'ru-ru': 'Объедините «{nodeName:string}» здесь',
  },
  mergeNodeHintMessage: {
    'en-us': 'Select a new target for "{nodeName:string}" to be merged into',
    'ru-ru': 'Выберите новый пункт назначения для слияния «{nodeName:string}»',
  },
  mergeNodeMessage: {
    'en-us': `
      All references to {treeName:string} node "{nodeName:string}" will be
      replaced with "{parentName:string}", and all descendants of
      "{nodeName:string}" will be moved to "{parentName:string}" with any
      descendants matching in name and rank being themselves merged recursively.
    `,
    'ru-ru': `
      Все ссылки на "{nodeName:string}" ({treeName:string}) будут заменены с
      "{parentName:string}", и все потомки "{nodeName:string}" будет перемещен
      в "{parentName:string}" с соответствующими потомками по названию и рангу
      подвергнется рекурсивному слиянию.
    `,
  },
  synonymizeNode: {
    'en-us': 'Synonymize node',
    'ru-ru': 'Синонимизировать',
  },
  makeSynonym: {
    'en-us': 'Make {nodeName:string} a synonym of {synonymName:string}',
    'ru-ru': 'Сделайте {nodeName:string} синонимом {synonymName:string}',
  },
  synonymizeNodeHintMessage: {
    'en-us': 'Select a target for "{nodeName:string}" to be synonymized to',
    'ru-ru': 'Выберите цель, синонимом которой будет «{nodeName:string}»',
  },
  synonymizeMessage: {
    'en-us': `
      The {treeName:string} node "{nodeName:string}" will be made a synonym of
      "{synonymName:string}".
    `,
    'ru-ru': `
      Узел «{nodeName:string}» ({treeName:string}) станет синонимом
      «{synonymName:string}».
    `,
  },
  desynonymizeNode: {
    'en-us': 'Desynonymize node',
    'ru-ru': 'Отменить синонимизацию',
  },
  desynonymizeNodeMessage: {
    'en-us': `
      "{nodeName:string}" will no longer be a synonym of "{synonymName:string}".
    `,
    'ru-ru':
      '«{nodeName:string}» больше не будет синонимом «{synonymName:string}».',
  },
  acceptedName: {
    'en-us': 'Preferred: {name:string}',
    'ru-ru': 'Предпочтительний: {name:string}',
  },
  treeViewTitle: {
    'en-us': '{treeName:string} Tree',
    'ru-ru': '{treeName:string} Дерево',
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
  nodeStats: {
    comment: "Used to show tree node's direct and indirect usages",
    'en-us': '({directCount:number|formatted}, {childCount:number|formatted})',
    'ru-ru': '({directCount:number|formatted}, {childCount:number|formatted})',
  },
  leafNodeStats: {
    comment: "Used to show leaf tree node's direct usages",
    'en-us': '({directCount:number|formatted})',
    'ru-ru': '({directCount:number|formatted})',
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
} as const);
