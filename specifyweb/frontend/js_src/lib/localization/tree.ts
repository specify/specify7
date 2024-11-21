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
    'fr-fr': 'Des arbres',
    'uk-ua': 'дерева',
    'de-ch': 'Hierarchien',
  },
  badStructure: {
    'en-us': 'Bad tree structure.',
    'ru-ru': 'Плохая древовидная структура.',
    'es-es': 'Mala estructura de árbol.',
    'fr-fr': 'Mauvaise arborescence.',
    'uk-ua': 'Погана структура дерева.',
    'de-ch': 'Fehlerhafte Baumstruktur.',
  },
  move: {
    'en-us': 'Move',
    'ru-ru': 'Двигаться',
    'es-es': 'Mover',
    'fr-fr': 'Se déplacer',
    'uk-ua': 'рухатися',
    'de-ch': 'Verschieben',
  },
  merge: {
    'en-us': 'Merge',
    'ru-ru': 'Объединить',
    'es-es': 'Unir',
    'fr-fr': 'Fusionner',
    'uk-ua': 'Об’єднати',
    'de-ch': 'Zusammenführen',
  },
  undoSynonymy: {
    'en-us': 'Undo Synonymy',
    'ru-ru': 'Листовой узел',
    'es-es': 'Nodo hoja',
    'fr-fr': 'Noeud feuille',
    'uk-ua': 'Листковий вузол',
    'de-ch': 'Synonymie rückgängig machen',
  },
  synonymize: {
    'en-us': 'Synonymize',
    'ru-ru': 'Подбирать синонимы',
    'es-es': 'Sinonimizar',
    'fr-fr': 'Synonymiser',
    'uk-ua': 'Синонімізувати',
    'de-ch': 'Synonymisieren',
  },
  actionFailed: {
    'en-us': 'Operation failed',
    'ru-ru': 'Операция не удалась',
    'es-es': 'Operación fallida',
    'fr-fr': "L'opération a échoué",
    'uk-ua': 'Операція не вдалася',
    'de-ch': 'Vorgang fehlgeschlagen',
  },
  actionFailedDescription: {
    'en-us':
      'The operation could not be completed due to the following errors:',
    'ru-ru': 'Прямой счет [X7X]',
    'es-es': 'Conteo directo [X7X]',
    'fr-fr': 'Synonymes : [X10X]',
    'de-ch': `
      Der Vorgang konnte aufgrund der folgenden Fehler nicht ausgeführt werden:
    `,
    'uk-ua': 'Прямий підрахунок [X7X].',
  },
  moveNode: {
    'en-us': 'Move node',
    'ru-ru': 'Переместить узел',
    'es-es': 'Mover nodo',
    'fr-fr': 'Déplacer le nœud',
    'uk-ua': 'Перемістити вузол',
    'de-ch': 'Knoten verschieben',
  },
  addChild: {
    'en-us': 'Add Child',
    'ru-ru': 'Добавить ребенка',
    'es-es': 'Agregar niño',
    'fr-fr': 'Ajouter un enfant',
    'uk-ua': 'Додати дитину',
    'de-ch': 'Kind hinzuzufügen',
  },
  moveNodeHere: {
    'en-us': 'Move "{nodeName:string}" here',
    'ru-ru': 'Переместите «{nodeName:string}» сюда',
    'es-es': 'Mueva "{nodeName:string}" aquí',
    'fr-fr': 'Déplacez "{nodeName:string}" ici',
    'uk-ua': 'Перемістіть сюди "{nodeName:string}".',
    'de-ch': 'Verschiebe "{nodeName:string}" hierhin',
  },
  moveNodePreparationsHere: {
    'en-us': 'Move all "{nodeName:string}" preparations here',
    'de-ch': 'Verschieben Sie alle "{nodeName:string}"-Vorbereitungen hierher',
    'es-es': 'Mueva todos los preparativos de "{nodeName:string}" aquí',
    'fr-fr': 'Déplacez ici toutes les préparations "{nodeName:string}"',
    'ru-ru': 'Переместите все заготовки "{nodeName:string}" сюда.',
    'uk-ua': 'Перемістіть сюди всі препарати "{nodeName:string}".',
  },
  nodeMoveMessage: {
    'en-us': `
      The {treeName:string} node "{nodeName:string}" will be placed, along with
      all of its descendants, under the new parent "{parentName:string}".
    `,
    'ru-ru': `
      Узел {treeName:string} «{nodeName:string}» будет помещен вместе со всеми
      его потомками в новый родительский узел «{parentName:string}».
    `,
    'es-es': `
      El nodo {treeName:string} "{nodeName:string}" se colocará, junto con todos
      sus descendientes, bajo el nuevo padre "{parentName:string}".
    `,
    'fr-fr': `
      Le nœud {treeName:string} "{nodeName:string}" sera placé, ainsi que tous
      ses descendants, sous le nouveau parent "{parentName:string}".
    `,
    'uk-ua': `
      Вузол {treeName:string} "{nodeName:string}" буде розміщено разом із усіма
      його нащадками під новим батьківським вузлом "{parentName:string}".
    `,
    'de-ch': `
      Der {treeName:string} Knoten "{nodeName:string}" wird zusammen mit allen
      seinen Unterknoten unter den neuen übergeordneten Knoten
      "{parentName:string}" platziert.
    `,
  },
  nodeBulkMoveMessage: {
    'en-us': `
      The {treeName:string} node "{nodeName:string}" preparations will be placed
      under the new location "{parentName:string}".
    `,
    'de-ch': `
      Die Vorbereitungen für den {treeName:string}-Knoten „{nodeName:string}“
      werden unter dem neuen Standort „{parentName:string}“ platziert.
    `,
    'es-es': 'Deshacer sinonimia',
    'fr-fr': 'Annuler la synonymie',
    'ru-ru': 'Отменить синонимию',
    'uk-ua': 'Скасувати синонімію',
  },
  cantMoveHere: {
    'en-us': "Can't move this tree node here",
    'ru-ru': 'Невозможно переместить этот узел дерева сюда',
    'es-es': 'No se puede mover este nodo del árbol aquí',
    'fr-fr': "Impossible de déplacer ce nœud d'arborescence ici",
    'uk-ua': 'Неможливо перемістити цей вузол дерева сюди',
    'de-ch': 'Dieser Knoten kann nicht hierhin verschoben werden',
  },
  cantMergeHere: {
    'en-us': "Can't merge this tree node here",
    'ru-ru': 'Невозможно объединить этот узел дерева здесь',
    'es-es': 'No se puede fusionar este nodo de árbol aquí',
    'fr-fr': "Impossible de fusionner ce nœud d'arborescence ici",
    'uk-ua': 'Неможливо об’єднати цей вузол дерева тут',
    'de-ch': 'Dieser Knoten kann hier nicht zusammengelegt werden',
  },
  cantMoveToSynonym: {
    'en-us': "Can't move to a synonym",
    'ru-ru': 'Невозможно перейти к синониму',
    'es-es': 'No puedo pasar a un sinónimo',
    'fr-fr': 'Impossible de passer à un synonyme',
    'uk-ua': 'Неможливо перейти до синоніма',
    'de-ch': 'Kann nicht zu einem Synonym verschieben',
  },
  cantMergeIntoSynonym: {
    'en-us': "Can't merge into synonyms",
    'ru-ru': 'Не могу объединить в синонимы',
    'es-es': 'No se puede fusionar en sinónimos',
    'fr-fr': 'Impossible de fusionner avec des synonymes',
    'uk-ua': 'Не можна об’єднувати в синоніми',
    'de-ch': 'Kann nicht zu Synonymen zusammenführen',
  },
  cantSynonymizeSynonym: {
    'en-us': "Can't synonymize with a synonym",
    'ru-ru': 'Не могу синонимизировать синонимом',
    'es-es': 'No puedo sinonimizar con un sinónimo',
    'fr-fr': 'Je ne peux pas synonyme avec un synonyme',
    'uk-ua': 'Не можна синонімізувати синонім',
    'de-ch': 'Kann nicht mit einem Synonym synonymisiert werden',
  },
  nodeMoveHintMessage: {
    'en-us': 'Select a new parent for "{nodeName:string}"',
    'ru-ru': 'Выберите нового родителя для «{nodeName:string}»',
    'es-es': 'Seleccione un nuevo padre para "{nodeName:string}"',
    'fr-fr': 'Sélectionnez un nouveau parent pour "{nodeName:string}"',
    'uk-ua': 'Виберіть новий батьківський елемент для "{nodeName:string}"',
    'de-ch': 'Wählen Sie ein neues Elternelement für "{nodeName:string}"',
  },
  mergeNode: {
    'en-us': 'Merge node',
    'ru-ru': 'Объединить узел',
    'es-es': 'Fusionar nodo',
    'fr-fr': 'Fusionner le nœud',
    'uk-ua': 'Вузол злиття',
    'de-ch': 'Knoten zusammenführen',
  },
  mergeNodeHere: {
    'en-us': 'Merge "{nodeName:string}" here',
    'ru-ru': 'Объедините «{nodeName:string}» здесь',
    'es-es': 'Fusionar "{nodeName:string}" aquí',
    'fr-fr': 'Fusionner "{nodeName:string}" ici',
    'uk-ua': 'Об\'єднайте "{nodeName:string}" тут',
    'de-ch': 'Führe "{nodeName:string}" hier zusammen',
  },
  mergeNodeHintMessage: {
    'en-us': 'Select a new target for "{nodeName:string}" to be merged into',
    'ru-ru':
      'Выберите новую цель для «{nodeName:string}», которую нужно объединить.',
    'es-es':
      'Seleccione un nuevo objetivo para "{nodeName:string}" para fusionarlo',
    'fr-fr': `
      Sélectionnez une nouvelle cible pour "{nodeName:string}" à fusionner dans
    `,
    'uk-ua':
      'Виберіть нову ціль для «{nodeName:string}», у яку потрібно об’єднати',
    'de-ch': 'Wähle ein neues Ziel um "{nodeName:string}" zusammenzuführen',
  },
  bulkMoveNodeHintMessage: {
    'en-us': `
      Select a new target for "{nodeName:string}" preparations to be moved into
    `,
    'de-ch': `
      Wählen Sie ein neues Ziel für die "{nodeName:string}"-Vorbereitungen, in
      die sie verschoben werden sollen
    `,
    'es-es': `
      Seleccione un nuevo objetivo para los preparativos "{nodeName:string}" al
      que se trasladará
    `,
    'fr-fr': `
      Sélectionnez une nouvelle cible pour les préparations "{nodeName:string}"
      à déplacer vers
    `,
    'ru-ru': `
      Выберите новую цель для препаратов «{nodeName:string}», в которую нужно
      переместить
    `,
    'uk-ua': `
      Виберіть нову ціль для препаратів "{nodeName:string}", до якої потрібно
      переміститися
    `,
  },
  mergeNodeMessage: {
    'en-us': `
      All references to {treeName:string} node "{nodeName:string}" will be
      replaced with "{parentName:string}", and all descendants of
      "{nodeName:string}" will be moved to "{parentName:string}" with any
      descendants matching in name and rank being themselves merged recursively.
    `,
    'ru-ru': `
      Все ссылки на узел {treeName:string} «{nodeName:string}» будут заменены на
      «{parentName:string}», а все потомки «{nodeName:string}» будут перемещены
      в «{parentName:string}», причем все потомки, совпадающие по имени и
      рангу, будут самими собой. объединены рекурсивно.
    `,
    'es-es': `
      Todas las referencias al nodo {treeName:string} "{nodeName:string}" serán
      reemplazadas por "{parentName:string}", y todos los descendientes de
      "{nodeName:string}" se moverán a "{parentName:string}" y todos los
      descendientes que coincidan en nombre y rango serán ellos mismos.
      fusionados recursivamente.
    `,
    'fr-fr': `
      Toutes les références au nœud {treeName:string} "{nodeName:string}" seront
      remplacées par "{parentName:string}", et tous les descendants de
      "{nodeName:string}" seront déplacés vers "{parentName:string}", tous les
      descendants correspondant en termes de nom et de rang étant eux-mêmes.
      fusionnés de manière récursive.
    `,
    'uk-ua': `
      Усі посилання на вузол {treeName:string} «{nodeName:string}» буде замінено
      на «{parentName:string}», а всі нащадки «{nodeName:string}» буде
      переміщено до «{parentName:string}», а будь-які нащадки, що відповідають
      імені та рангу, будуть самі собою об'єднані рекурсивно.
    `,
    'de-ch': `
      Alle Referenzen zu {treeName:string} "{nodeName:string}" werden mit
      "{parentName:string}" ersetzt. Alle Nachkommen von "{nodeName:string}"
      werden nach "{parentName:string}" verschoben, wobei alle Nachkommen, die
      in Name und Rang übereinstimmen, selbst rekursiv zusammengeführt werden.
    `,
  },
  synonymizeNode: {
    'en-us': 'Synonymize node',
    'ru-ru': 'Узел [X4X] «[X28X]» станет синонимом «[X74X]».',
    'es-es': 'El nodo [X4X] "[X28X]" se convertirá en sinónimo de "[X74X]".',
    'fr-fr': 'Le nœud [X4X] "[X28X]" deviendra synonyme de "[X74X]".',
    'uk-ua': 'Вузол [X4X] "[X28X]" стане синонімом "[X74X]".',
    'de-ch': 'Knoten synonymisieren',
  },
  makeSynonym: {
    'en-us': 'Make {nodeName:string} a synonym of {synonymName:string}',
    'ru-ru': 'Сделайте {nodeName:string} синонимом {synonymName:string}',
    'es-es': 'Hacer de {nodeName:string} un sinónimo de {synonymName:string}',
    'fr-fr': 'Faire de {nodeName:string} un synonyme de {synonymName:string}',
    'uk-ua': 'Зробити {nodeName:string} синонімом {synonymName:string}',
    'de-ch':
      'Aus {nodeName:string} ein Synonym von {synonymName:string} machen',
  },
  synonymizeNodeHintMessage: {
    'en-us': 'Select a target for "{nodeName:string}" to be synonymized to',
    'ru-ru':
      'Выберите цель для «{nodeName:string}», которая будет синонимизирована.',
    'es-es': 'Seleccione un destino para que "{nodeName:string}" se sinonimice',
    'fr-fr': 'Sélectionnez une cible pour "{nodeName:string}" à synonymiser',
    'uk-ua': 'Виберіть ціль для "{nodeName:string}", який буде синонімічним',
    'de-ch': 'Wähle Ziel um "{nodeName:string}" daran zu synonymisieren',
  },
  synonymizeMessage: {
    'en-us': `
      The {treeName:string} node "{nodeName:string}" will be made a synonym of
      "{synonymName:string}".
    `,
    'ru-ru': `
      Узел {treeName:string} «{nodeName:string}» станет синонимом
      «{synonymName:string}».
    `,
    'es-es': `
      El nodo {treeName:string} "{nodeName:string}" se convertirá en sinónimo de
      "{synonymName:string}".
    `,
    'fr-fr': 'Verticale',
    'de-ch': `
      Der {treeName:string}-Knoten "{nodeName:string}" wird zu einem Synonym von
      "{synonymName:string}".
    `,
    'uk-ua': `
      Вузол {treeName:string} "{nodeName:string}" стане синонімом
      "{synonymName:string}".
    `,
  },
  desynonymizeNode: {
    'en-us': 'Desynonymize node',
    'ru-ru': 'Десинонимизировать узел',
    'es-es': 'Desinonimizar nodo',
    'fr-fr': 'Désynonymiser le nœud',
    'uk-ua': 'Десинонімізувати вузол',
    'de-ch': 'Knoten desynonymisieren',
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
    'de-ch': `
      "{nodeName:string}" wird nicht mehr ein Synonym von
      "{synonymName:string}" sein.
    `,
    'uk-ua':
      '"{nodeName:string}" більше не буде синонімом "{synonymName:string}".',
  },
  acceptedName: {
    'en-us': 'Preferred: {name:string}',
    'ru-ru': 'Предпочтительно: {name:string}',
    'es-es': 'Preferido: {name:string}',
    'fr-fr': 'Préféré : {name:string}',
    'uk-ua': 'Бажано: {name:string}',
    'de-ch': 'Bevorzugt: {name:string}',
  },
  synonyms: {
    'en-us': 'Synonyms: {names:string}',
    'de-ch': 'Elemente verschieben',
    'es-es': 'Sinónimos: {names:string}',
    'fr-fr': 'Synonymes : {names:string}',
    'ru-ru': 'Синонимы: {names:string}',
    'uk-ua': 'Синоніми: {names:string}',
  },
  treeViewTitle: {
    'en-us': '{treeName:string} Tree',
    'ru-ru': '{treeName:string} Дерево',
    'es-es': '{treeName:string} Árbol',
    'fr-fr': '{treeName:string} Arbre',
    'uk-ua': '{treeName:string} Дерево',
    'de-ch': '{treeName:string} Baum',
  },
  searchTreePlaceholder: {
    'en-us': 'Search Tree',
    'ru-ru': 'Дерево поиска',
    'es-es': 'Árbol de búsqueda',
    'fr-fr': 'Arbre de recherche',
    'uk-ua': 'Дерево пошуку',
    'de-ch': 'Baum durchsuchen',
  },
  opened: {
    'en-us': 'Opened',
    'ru-ru': 'Открыто',
    'es-es': 'Abrió',
    'fr-fr': 'Ouvert',
    'uk-ua': 'Відкрито',
    'de-ch': 'Geöffnet',
  },
  closed: {
    'en-us': 'Closed',
    'ru-ru': 'Закрыто',
    'es-es': 'Cerrado',
    'fr-fr': 'Fermé',
    'uk-ua': 'ЗАЧИНЕНО',
    'de-ch': 'Geschlossen',
  },
  leafNode: {
    'en-us': 'Leaf Node',
    'ru-ru': 'Листовой узел',
    'es-es': 'Nodo hoja',
    'fr-fr': 'Noeud feuille',
    'uk-ua': 'Листковий вузол',
    'de-ch': 'Blattknoten',
  },
  nodeStats: {
    comment: "Used to show tree node's direct and indirect usages",
    'en-us': '({directCount:number|formatted}, {childCount:number|formatted})',
    'ru-ru': '({directCount:number|formatted}, {childCount:number|formatted})',
    'es-es': '({directCount:number|formatted}, {childCount:number|formatted})',
    'fr-fr': '({directCount:number|formatted}, {childCount:number|formatted})',
    'uk-ua': '({directCount:number|formatted}, {childCount:number|formatted})',
    'de-ch': '({directCount:number|formatted}, {childCount:number|formatted})',
  },
  leafNodeStats: {
    comment: "Used to show leaf tree node's direct usages",
    'en-us': '({directCount:number|formatted})',
    'ru-ru': '({directCount:number|formatted})',
    'es-es': '({directCount:number|formatted})',
    'fr-fr': '({directCount:number|formatted})',
    'uk-ua': '({directCount:number|formatted})',
    'de-ch': '({directCount:number|formatted})',
  },
  directCollectionObjectCount: {
    comment: 'Example: Direct Collection Object count',
    'en-us': 'Direct {collectionObjectTable:string} Count',
    'ru-ru': 'Прямой счет {collectionObjectTable:string}',
    'es-es': 'Conteo directo {collectionObjectTable:string}',
    'de-ch': 'Direkte {collectionObjectTable:string} Anzahl',
    'fr-fr': 'Comptage direct {collectionObjectTable:string}',
    'uk-ua': 'Прямий підрахунок {collectionObjectTable:string}.',
  },
  indirectCollectionObjectCount: {
    comment: 'Example: Indirect Collection Object count',
    'en-us': 'Indirect {collectionObjectTable:string} Count',
    'ru-ru': 'Косвенный счет {collectionObjectTable:string}',
    'es-es': 'Recuento indirecto {collectionObjectTable:string}',
    'fr-fr': 'Nombre indirect {collectionObjectTable:string}',
    'uk-ua': 'Непрямий підрахунок {collectionObjectTable:string}.',
    'de-ch': 'Indirekte {collectionObjectTable:string} Anzahl',
  },
  editRanks: {
    'en-us': 'Edit Ranks',
    'ru-ru': 'Редактировать ранги',
    'es-es': 'Editar rangos',
    'fr-fr': 'Modifier les classements',
    'uk-ua': 'Редагувати ранги',
    'de-ch': 'Positionen bearbeiten',
  },
  resourceToDelete: {
    'en-us': 'This will permanently delete the following resource',
    'es-es': 'Esto eliminará permanentemente el siguiente recurso.',
    'fr-fr': 'Cela supprimera définitivement la ressource suivante',
    'ru-ru': 'Это приведет к безвозвратному удалению следующего ресурса',
    'uk-ua': 'Це призведе до остаточного видалення наступного ресурсу',
    'de-ch': 'Dadurch wird die folgende Ressource dauerhaft gelöscht',
  },
  associatedNodesOnly: {
    'en-us': 'Show only nodes with associated objects',
    'de-ch': 'Nur Knoten mit verknüpften Objekten anzeigen',
    'es-es': 'Vertical',
    'fr-fr': 'Verticale',
    'ru-ru': 'Вертикальный',
    'uk-ua': 'Вертикальний',
  },
  splitView: {
    'en-us': 'Split View',
    'de-ch': 'Geteilte Sicht',
    'es-es': 'Vista dividida',
    'fr-fr': 'Vue partagé',
    'ru-ru': 'Разделенный вид',
    'uk-ua': 'Розділений перегляд',
  },
  horizontal: {
    'en-us': 'Horizontal',
    'de-ch': 'Horizontal',
    'es-es': 'Horizontal',
    'fr-fr': 'Horizontal',
    'ru-ru': 'Горизонтальный',
    'uk-ua': 'Горизонтальний',
  },
  vertical: {
    'en-us': 'Vertical',
    'de-ch': 'Vertikal',
    'es-es': 'Vertical',
    'fr-fr': 'Verticale',
    'ru-ru': 'Вертикальный',
    'uk-ua': 'Вертикальний',
  },
  synchronize: {
    'en-us': 'Synchronize',
    'de-ch': 'Synchronisieren',
    'es-es': 'Sincronizar',
    'fr-fr': 'Synchroniser',
    'uk-ua': 'Синхронізувати',
    'ru-ru': 'Синхронизировать',
  },
  addNewRank: {
    'en-us': 'Add New Rank',
    'de-ch': 'Neuen Rang hinzufügen',
    'es-es': 'Agregar nuevo rango',
    'fr-fr': 'Ajouter un nouveau classement',
    'ru-ru': 'Добавить новый ранг',
    'uk-ua': 'Додати новий ранг',
  },
  chooseParentRank: {
    'en-us': 'Choose Parent Rank',
    'de-ch': 'Übergeordneten Rang auswählen',
    'es-es': 'Elija el rango de padres',
    'fr-fr': 'Choisissez le rang des parents',
    'ru-ru': 'Выберите родительский ранг',
    'uk-ua': 'Виберіть батьківський рейтинг',
  },
  moveItems: {
    'en-us': 'Move Items',
    'de-ch': 'Elemente verschieben',
    'es-es': 'Mover elementos',
    'fr-fr': 'Déplacer des éléments',
    'ru-ru': 'Переместить предметы',
    'uk-ua': 'Переміщення елементів',
  },
  addTree: {
    'en-us': 'Add Tree',
  },
  addRootNode: {
    'en-us': 'Add root node',
  },
  treePicker: {
    'en-us': 'Tree Picker',
  },
  botany: {
    'en-us': 'Botany',
  },
  entomology: {
    'en-us': 'Entomology',
  },
  herpetology: {
    'en-us': 'Herpetology',
  },
  ichthyology: {
    'en-us': 'Ichthyology',
  },
  invertpaleo: {
    'en-us': 'Invertebrate Paleontology',
  },
  invertzoo: {
    'en-us': 'Invertebrate Zoology',
  },
  mammalogy: {
    'en-us': 'Mammalogy',
  },
  ornithology: {
    'en-us': 'Ornithology',
  },
  paleobot: {
    'en-us': 'Paleobotany',
  },
  vascplant: {
    'en-us': 'Vascular Plants',
  },
  vertpaleo: {
    'en-us': 'Vertebrate Paleontology',
  },
  defaultRemarks: {
    'en-us': 'A default taxon tree',
  },
  emptyTree: {
    'en-us': 'Empty Tree',
  },
  minerals: {
    'en-us': 'Minerals',
  },
  rocks: {
    'en-us': 'Rocks',
  },
  meteorites: {
    'en-us': 'Meteorites',
  },
} as const);
