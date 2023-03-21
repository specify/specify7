/**
 * Localization strings used in the Tree Viewer
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const treeText = createDictionary({
  trees: {
    'en-us': 'Trees',
    'ru-ru': 'Деревья',
    'es-es': 'Árboles',
    'fr-fr': 'Arbres',
    'uk-ua': 'дерева',
  },
  badStructure: {
    'en-us': 'Bad tree structure.',
    'ru-ru': 'У дерева плохая структура.',
    'es-es': 'Mala estructura de árbol.',
    'fr-fr': 'Structure hiérarchique incorrecte.',
    'uk-ua': 'Погана структура дерева.',
  },
  move: {
    'en-us': 'Move',
    'ru-ru': 'Переместить',
    'es-es': 'Mover',
    'fr-fr': 'Déplacer',
    'uk-ua': 'рухатися',
  },
  merge: {
    'en-us': 'Merge',
    'ru-ru': 'Объединить',
    'es-es': 'Unir',
    'fr-fr': 'Fusionner',
    'uk-ua': 'Об’єднати',
  },
  undoSynonymy: {
    'en-us': 'Undo Synonymy',
    'ru-ru': 'Отменить синонимию',
    'es-es': 'Deshacer sinonimia',
    'fr-fr': 'Annuler la synonymie',
    'uk-ua': 'Скасувати синонімію',
  },
  synonymize: {
    'en-us': 'Synonymize',
    'ru-ru': 'Сделать синонимом',
    'es-es': 'Sinonimizar',
    'fr-fr': 'Synonymiser',
    'uk-ua': 'Синонімізувати',
  },
  actionFailed: {
    'en-us': 'Operation failed',
    'ru-ru': 'Операция провалена',
    'es-es': 'Operación fallida',
    'fr-fr': "L'opération a échoué",
    'uk-ua': 'Операція не виконана',
  },
  actionFailedDescription: {
    'en-us':
      'The operation could not be completed due to the following errors:',
    'ru-ru': 'Операция не может быть завершена из-за следующих ошибок:',
    'es-es':
      'No se pudo completar la operación debido a los siguientes errores:',
    'fr-fr': `
      L'opération n'a pas pu être effectuée en raison des erreurs suivantes :
    `,
    'uk-ua': 'Операцію не вдалося завершити через такі помилки:',
  },
  moveNode: {
    'en-us': 'Move node',
    'ru-ru': 'Переместить',
    'es-es': 'Mover nodo',
    'fr-fr': 'Déplacer le nœud',
    'uk-ua': 'Перемістити вузол',
  },
  addChild: {
    'en-us': 'Add Child',
    'ru-ru': 'Добавить Ребенка',
    'es-es': 'Agregar niño',
    'fr-fr': 'Ajouter un enfant',
    'uk-ua': 'Додати дитину',
  },
  moveNodeHere: {
    'en-us': 'Move "{nodeName:string}" here',
    'ru-ru': 'Переместите «{nodeName:string}» сюда',
    'es-es': 'Mueva "{nodeName:string}" aquí',
    'fr-fr': 'Déplacer « {nodeName:string} » ici',
    'uk-ua': 'Перемістіть сюди "{nodeName:string}".',
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
    'es-es': `
      El nodo {treeName:string} "{nodeName:string}" se colocará, junto con todos
      sus descendientes, bajo el nuevo padre "{parentName:string}".
    `,
    'fr-fr': `
      Le nœud {treeName:string} "{nodeName:string}" sera placé, avec tous ses
      descendants, sous le nouveau parent "{parentName:string}".
    `,
    'uk-ua': `
      Вузол {treeName:string} "{nodeName:string}" буде розміщено разом із усіма
      його нащадками під новим батьківським вузлом "{parentName:string}".
    `,
  },
  cantMoveHere: {
    'en-us': "Can't move this tree node here",
    'ru-ru': 'Невозможно переместить этот узел в этот узел',
    'es-es': 'No se puede mover este nodo de árbol aquí',
    'fr-fr': "Impossible de déplacer ce nœud d'arborescence ici",
    'uk-ua': 'Неможливо перемістити цей вузол дерева сюди',
  },
  cantMergeHere: {
    'en-us': "Can't merge this tree node here",
    'ru-ru': 'Невозможно объединить этот узел в этот узел',
    'es-es': 'No se puede fusionar este nodo de árbol aquí',
    'fr-fr': "Impossible de fusionner ce nœud d'arborescence ici",
    'uk-ua': 'Неможливо об’єднати цей вузол дерева тут',
  },
  cantMoveToSynonym: {
    'en-us': "Can't move to a synonym",
    'ru-ru': 'Невозможно переместить в синоним',
    'es-es': 'No se puede mover a un sinónimo',
    'fr-fr': 'Impossible de passer à un synonyme',
    'uk-ua': 'Неможливо перейти до синоніма',
  },
  cantMergeIntoSynonym: {
    'en-us': "Can't merge into synonyms",
    'ru-ru': 'Невозможно объединить в синонимы',
    'es-es': 'No se puede fusionar en sinónimos',
    'fr-fr': 'Impossible de fusionner en synonymes',
    'uk-ua': 'Неможливо злити в синоніми',
  },
  cantSynonymizeSynonym: {
    'en-us': "Can't synonymize with a synonym",
    'ru-ru': 'Невозможно сделать синонимом синонима',
    'es-es': 'No se puede sinonimizar con un sinónimo',
    'fr-fr': 'Ne peut pas synonyme avec un synonyme',
    'uk-ua': 'Не можна синонімізувати синонім',
  },
  nodeMoveHintMessage: {
    'en-us': 'Select a new parent for "{nodeName:string}"',
    'ru-ru': 'Выберите нового родителя для «{nodeName:string}»',
    'es-es': 'Seleccione un nuevo padre para "{nodeName:string}"',
    'fr-fr': 'Sélectionnez un nouveau parent pour « {nodeName:string} »',
    'uk-ua': 'Виберіть новий батьківський елемент для "{nodeName:string}"',
  },
  mergeNode: {
    'en-us': 'Merge node',
    'ru-ru': 'Объединить',
    'es-es': 'Combinar nodo',
    'fr-fr': 'Fusionner le nœud',
    'uk-ua': 'Вузол злиття',
  },
  mergeNodeHere: {
    'en-us': 'Merge "{nodeName:string}" here',
    'ru-ru': 'Объедините «{nodeName:string}» здесь',
    'es-es': 'Combinar "{nodeName:string}" aquí',
    'fr-fr': 'Fusionner « {nodeName:string} » ici',
    'uk-ua': 'Об\'єднайте "{nodeName:string}" тут',
  },
  mergeNodeHintMessage: {
    'en-us': 'Select a new target for "{nodeName:string}" to be merged into',
    'ru-ru': 'Выберите новый пункт назначения для слияния «{nodeName:string}»',
    'es-es':
      'Seleccione un nuevo destino para que "{nodeName:string}" se fusione',
    'fr-fr': `
      Sélectionnez une nouvelle cible pour "{nodeName:string}" à fusionner dans
    `,
    'uk-ua':
      'Виберіть нову ціль для «{nodeName:string}», у яку потрібно об’єднати',
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
    'es-es': `
      Todas las referencias al nodo {treeName:string} "{nodeName:string}" se
      reemplazarán con "{parentName:string}", y todos los descendientes de
      "{nodeName:string}" se moverán a "{parentName:string}" y los
      descendientes que coincidan en nombre y rango serán ellos mismos combinado
      recursivamente.
    `,
    'fr-fr': `
      Toutes les références au nœud {treeName:string} "{nodeName:string}" seront
      remplacées par "{parentName:string}", et tous les descendants de
      "{nodeName:string}" seront déplacés vers "{parentName:string}", tous les
      descendants correspondant au nom et au rang étant eux-mêmes fusionné
      récursivement.
    `,
    'uk-ua': `
      Усі посилання на вузол {treeName:string} «{nodeName:string}» буде замінено
      на «{parentName:string}», а всі нащадки «{nodeName:string}» буде
      переміщено до «{parentName:string}», а будь-які нащадки, що відповідають
      імені та рангу, будуть самі собою об'єднані рекурсивно.
    `,
  },
  synonymizeNode: {
    'en-us': 'Synonymize node',
    'ru-ru': 'Синонимизировать',
    'es-es': 'Sinonimizar nodo',
    'fr-fr': 'Synonymiser le nœud',
    'uk-ua': 'Синонімізувати вузол',
  },
  makeSynonym: {
    'en-us': 'Make {nodeName:string} a synonym of {synonymName:string}',
    'ru-ru': 'Сделайте {nodeName:string} синонимом {synonymName:string}',
    'es-es': 'Hacer {nodeName:string} un sinónimo de {synonymName:string}',
    'fr-fr': 'Faire de {nodeName:string} un synonyme de {synonymName:string}',
    'uk-ua': 'Зробіть {nodeName:string} синонімом {synonymName:string}',
  },
  synonymizeNodeHintMessage: {
    'en-us': 'Select a target for "{nodeName:string}" to be synonymized to',
    'ru-ru': 'Выберите цель, синонимом которой будет «{nodeName:string}»',
    'es-es':
      'Seleccione un objetivo para "{nodeName:string}" para ser sinónimo',
    'fr-fr': 'Sélectionnez une cible pour "{nodeName:string}" à synonyme de',
    'uk-ua': `
      Виберіть ціль для "{nodeName:string}", до якого потрібно синонімізувати
    `,
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
    'es-es': `
      El nodo {treeName:string} "{nodeName:string}" se convertirá en sinónimo de
      "{synonymName:string}".
    `,
    'fr-fr': `
      Le nœud {treeName:string} "{nodeName:string}" deviendra un synonyme de
      "{synonymName:string}".
    `,
    'uk-ua': `
      Вузол {treeName:string} "{nodeName:string}" стане синонімом
      "{synonymName:string}".
    `,
  },
  desynonymizeNode: {
    'en-us': 'Desynonymize node',
    'ru-ru': 'Отменить синонимизацию',
    'es-es': 'Desinonimizar nodo',
    'fr-fr': 'Désynonymiser le nœud',
    'uk-ua': 'Десинонімізувати вузол',
  },
  desynonymizeNodeMessage: {
    'en-us': `
      "{nodeName:string}" will no longer be a synonym of "{synonymName:string}".
    `,
    'ru-ru':
      '«{nodeName:string}» больше не будет синонимом «{synonymName:string}».',
    'es-es':
      '"{nodeName:string}" ya no será sinónimo de "{synonymName:string}".',
    'fr-fr':
      '"{nodeName:string}" ne sera plus synonyme de "{synonymName:string}".',
    'uk-ua':
      '"{nodeName:string}" більше не буде синонімом "{synonymName:string}".',
  },
  acceptedName: {
    'en-us': 'Preferred: {name:string}',
    'ru-ru': 'Предпочтительний: {name:string}',
    'es-es': 'Preferido: {name:string}',
    'fr-fr': 'Préféré : {name:string}',
    'uk-ua': 'Бажано: {name:string}',
  },
  treeViewTitle: {
    'en-us': '{treeName:string} Tree',
    'ru-ru': '{treeName:string} Дерево',
    'es-es': '{treeName:string} Árbol',
    'fr-fr': 'Arbre {treeName:string}',
    'uk-ua': '{treeName:string} Дерево',
  },
  searchTreePlaceholder: {
    'en-us': 'Search Tree',
    'ru-ru': 'Поиск',
    'es-es': 'Árbol de búsqueda',
    'fr-fr': "Rechercher dans l'arbre",
    'uk-ua': 'Дерево пошуку',
  },
  opened: {
    'en-us': 'Opened',
    'ru-ru': 'Открыт',
    'es-es': 'Abrió',
    'fr-fr': 'Ouvert',
    'uk-ua': 'Відкрито',
  },
  closed: {
    'en-us': 'Closed',
    'ru-ru': 'Закрыт',
    'es-es': 'Cerrado',
    'fr-fr': 'Fermé',
    'uk-ua': 'ЗАЧИНЕНО',
  },
  leafNode: {
    'en-us': 'Leaf Node',
    'ru-ru': 'Угловой узел',
    'es-es': 'Nodo hoja',
    'fr-fr': 'Noeud feuille',
    'uk-ua': 'Листковий вузол',
  },
  nodeStats: {
    comment: "Used to show tree node's direct and indirect usages",
    'en-us': '({directCount:number|formatted}, {childCount:number|formatted})',
    'ru-ru': '({directCount:number|formatted}, {childCount:number|formatted})',
    'es-es': '({directCount:number|formatted}, {childCount:number|formatted})',
    'fr-fr': '({directCount:number|formatted}, {childCount:number|formatted})',
    'uk-ua': '({directCount:number|formatted}, {childCount:number|formatted})',
  },
  leafNodeStats: {
    comment: "Used to show leaf tree node's direct usages",
    'en-us': '({directCount:number|formatted})',
    'ru-ru': '({directCount:number|formatted})',
    'es-es': '({directCount:number|formatted})',
    'fr-fr': '({directCount:number|formatted})',
    'uk-ua': '({directCount:number|formatted})',
  },
  directCollectionObjectCount: {
    comment: 'Example: Direct Collection Object count',
    'en-us': 'Direct {collectionObjectTable:string} Count',
    'ru-ru': 'Количество прямых {collectionObjectTable:string}',
    'es-es': 'Recuento directo {collectionObjectTable:string}',
    'fr-fr': 'Comptage direct {collectionObjectTable:string}',
    'uk-ua': 'Прямий підрахунок {collectionObjectTable:string}.',
  },
  indirectCollectionObjectCount: {
    comment: 'Example: Indirect Collection Object count',
    'en-us': 'Indirect {collectionObjectTable:string} Count',
    'ru-ru': 'Количество непрямых {collectionObjectTable:string}',
    'es-es': 'Recuento indirecto {collectionObjectTable:string}',
    'fr-fr': 'Comptage {collectionObjectTable:string} indirect',
    'uk-ua': 'Непрямий підрахунок {collectionObjectTable:string}.',
  },
  editRanks: {
    'en-us': 'Edit Ranks',
    'ru-ru': 'Изменить ранги',
    'es-es': 'Editar rangos',
    'fr-fr': 'Modifier les rangs',
    'uk-ua': 'Редагувати ранги',
  },
  resourceToDelete: {
    'en-us': 'This will permanently delete the following resource',
    'es-es': 'Esto eliminará permanentemente el siguiente recurso',
    'fr-fr': 'Cela supprimera définitivement la ressource suivante',
    'ru-ru': 'Это навсегда удалит следующий ресурс',
    'uk-ua': 'Це призведе до остаточного видалення наступного ресурсу',
  },
} as const);
