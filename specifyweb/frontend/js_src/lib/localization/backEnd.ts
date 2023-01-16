/**
 * Localization for strings that are returned from the back-end. (back-end
 * returns a key, and front-end resolves the key into a string)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const backEndText = createDictionary({
  failedParsingBoolean: {
    'en-us': 'value "{value:string}" not resolvable to True or False',
    'ru-ru': 'значение "{value:string}" не разрешается to True or False',
    'es-es':
      'el valor "{value:string}" no se puede resolver en Verdadero o Falso',
    'fr-fr':
      'la valeur "{value:string}" ne peut pas être résolue en Vrai ou Faux',
    'uk-ua': 'значення "{value:string}" не можна розв’язати як True або False',
  },
  failedParsingDecimal: {
    'en-us': 'value "{value:string}" is not a valid decimal value',
    'ru-ru': 'значение "{value:string}" не является допустимым чеслом',
    'es-es': 'el valor "{value:string}" no es un valor decimal válido',
    'fr-fr': 'la valeur "{value:string}" n\'est pas une valeur décimale valide',
    'uk-ua': 'значення "{value:string}" не є дійсним десятковим значенням',
  },
  failedParsingFloat: {
    'en-us': 'value "{value:string}" is not a valid floating point value',
    'ru-ru': `
      значение "{value:string}" не является допустимым числом с плавающей точкой
    `,
    'es-es':
      'el valor "{value:string}" no es un valor de punto flotante válido',
    'fr-fr': `
      la valeur "{value:string}" n\'est pas une valeur à virgule flottante
      valide
    `,
    'uk-ua':
      'значення "{value:string}" не є дійсним значенням з плаваючою комою',
  },
  failedParsingPickList: {
    'en-us': `
      {value:string} is not a legal value in this picklist field.

      Click on the arrow to choose among available options.
    `,
    'ru-ru': `
      {value:string} не является допустимым значением в этом списке.

      Нажмите на стрелку, чтобы выбрать один из доступных вариантов.
    `,
    'es-es': `
      {value:string} no es un valor legal en este campo de lista de selección.

      Haga clic en la flecha para elegir entre las opciones disponibles.
    `,
    'fr-fr': `
      {value:string} n'est pas une valeur légale dans ce champ de liste de
      sélection.

      Cliquez sur la flèche pour choisir parmi les options disponibles.
    `,
    'uk-ua': `
      {value:string} не є допустимим значенням у цьому полі списку вибору.

      Натисніть на стрілку, щоб вибрати серед доступних варіантів.
    `,
  },
  failedParsingAgentType: {
    'en-us': `
      bad agent type: "{badType:string}". Expected one of {validTypes:string}
    `,
    'ru-ru': `
      неверный тип агента: "{badType:string}". Ожидается один из
      {validTypes:string}
    `,
    'es-es': `
      tipo de agente incorrecto: "{badType:string}". Esperaba uno de
      {validTypes:string}
    `,
    'fr-fr': `
      mauvais type d\'agent : "{badType:string}". Attendu l\'un des
      {validTypes:string}
    `,
    'uk-ua': `
      поганий тип агента: "{badType:string}". Очікується один із
      {validTypes:string}
    `,
  },
  pickListValueTooLong: {
    'en-us': `
      value from picklist {pickList:string} longer than the max of
      {maxLength:number|formatted} for field
    `,
    'ru-ru': `
      значение из списка {pickList:string} длиннее максимального значения
      {maxLength:number|formatted} для поля
    `,
    'es-es': `
      valor de la lista de selección {pickList:string} más largo que el máximo
      de {maxLength:number|formatted} para el campo
    `,
    'fr-fr': `
      valeur de la liste de sélection {pickList:string} plus longue que le
      maximum de {maxLength:number|formatted} pour le champ
    `,
    'uk-ua': `
      значення зі списку вибору {pickList:string} більше, ніж максимальне
      значення {maxLength:number|formatted} для поля
    `,
  },
  valueTooLong: {
    'en-us':
      'value must not have length greater than {maxLength:number|formatted}',
    'ru-ru': 'значение не должно быть длиннее {maxLength:number|formatted}',
    'es-es': `
      el valor no debe tener una longitud superior a
      {maxLength:number|formatted}
    `,
    'fr-fr': `
      la valeur ne doit pas avoir une longueur supérieure à
      {maxLength:number|formatted}
    `,
    'uk-ua':
      'довжина значення не повинна перевищувати {maxLength:number|formatted}',
  },
  invalidYear: {
    'en-us': 'date value must contain four digit year: {value:string}',
    'ru-ru':
      'значение даты должно содержать четырехзначный год: {value:string}',
    'es-es': `
      el valor de la fecha debe contener un año de cuatro
      dígitos: {value:string}
    `,
    'fr-fr': `
      la valeur de date doit contenir l'année à quatre chiffres : {value:string}
    `,
    'uk-ua': 'значення дати має містити чотири цифри року: {value:string}',
  },
  badDateFormat: {
    'en-us': 'bad date value: {value:string}. expected: {format:string}',
    'ru-ru':
      'неверное значение даты: {value:string}. ожидается: {format:string}',
    'es-es':
      'valor de fecha incorrecta: {value:string}. esperado: {format:string}',
    'fr-fr':
      'valeur de date incorrecte : {value:string}. attendu : {format:string}',
    'uk-ua':
      'неправильне значення дати: {value:string}. очікується: {format:string}',
  },
  coordinateBadFormat: {
    'en-us': 'bad latitude or longitude value: {value:string}',
    'ru-ru': 'неверное значение широты или долготы: {value:string}',
    'es-es': 'valor incorrecto de latitud o longitud: {value:string}',
    'fr-fr': 'mauvaise valeur de latitude ou de longitude : {value:string}',
    'uk-ua': 'неправильне значення широти або довготи: {value:string}',
  },
  latitudeOutOfRange: {
    'en-us': 'latitude must be between -90 and 90. Actual: {value:string}',
    'ru-ru': 'широта должна быть между -90 и 90. Фактически: {value:string}',
    'es-es': 'la latitud debe estar entre -90 y 90. Real: {value:string}',
    'fr-fr':
      'la latitude doit être comprise entre -90 et 90. Réel : {value:string}',
    'uk-ua': 'широта має бути між -90 і 90. Фактична: {value:string}',
  },
  longitudeOutOfRange: {
    'en-us': 'longitude must be between -180 and 180. Actual: {value:string}',
    'ru-ru': 'долгота должна быть между -180 и 180. Фактически: {value:string}',
    'es-es': 'la longitud debe estar entre -180 y 180. Real: {value:string}',
    'fr-fr': `
      la longitude doit être comprise entre -180 et 180. Réelle : {value:string}
    `,
    'uk-ua': 'довгота має бути між -180 і 180. Фактична: {value:string}',
  },
  invalidPartialRecord: {
    'en-us': 'this field must be empty if {column:string} is empty',
    'ru-ru': 'это поле должно быть пустым, если {column:string} пусто',
    'es-es': 'este campo debe estar vacío si {column:string} está vacío',
    'fr-fr': 'ce champ doit être vide si {column:string} est vide',
    'uk-ua': 'це поле має бути порожнім, якщо {column:string} порожнє',
  },
  fieldRequiredByUploadPlan: {
    'en-us': 'field is required by upload plan mapping',
    'ru-ru': 'поле обязательно для загрузки плана',
    'es-es': 'el campo es obligatorio para la asignación del plan de carga',
    'fr-fr': 'le champ est requis par le mappage du plan de téléchargement',
    'uk-ua': 'поле є обов’язковим для зіставлення плану завантаження',
  },
  invalidTreeStructure: {
    'en-us': 'There are multiple "Uploaded" placeholder values in the tree!',
    'ru-ru': 'В дереве есть несколько веток с именем "Uploaded"!',
    'es-es':
      '¡Hay múltiples valores de marcador de posición "Cargados" en el árbol!',
    'fr-fr': `
      Il existe plusieurs valeurs d\'espace réservé "Téléchargées" dans
      l\'arborescence !
    `,
    'uk-ua': 'У дереві є кілька значень заповнювача "Завантажено"!',
  },
  missingRequiredTreeParent: {
    'en-us': `
      Missing or unmapped required tree parent rank value for "{names:string}".
    `,
    'ru-ru': `
      Отсутствует или не сопоставлено необходимое значение родительского ранга
      для дерева "{names:string}".
    `,
    'es-es': `
      Falta el valor de clasificación principal del árbol requerido o no está
      asignado para "{names:string}".
    `,
    'fr-fr': `
      Valeur de rang parent d\'arborescence requise manquante ou non mappée pour
      "{names:string}".
    `,
    'uk-ua': `
      Відсутнє або не зіставлене необхідне значення рангу батьківського дерева
      для "{names:string}".
    `,
  },
  showTraceback: {
    'en-us': 'Show Traceback',
    'es-es': 'Mostrar seguimiento',
    'fr-fr': 'Afficher la trace',
    'ru-ru': 'Показать трассировку',
    'uk-ua': 'Показати Traceback',
  },
  fieldNotUnique: {
    'en-us': '{tableName:string} must have unique {fieldName:string}',
    'es-es': '{tableName:string} debe tener un único {fieldName:string}',
    'fr-fr': '{tableName:string} doit avoir un {fieldName:string} unique',
    'ru-ru': '{tableName:string} должен иметь уникальный {fieldName:string}',
    'uk-ua': '{tableName:string} має мати унікальний {fieldName:string}',
  },
  childFieldNotUnique: {
    'en-us': `
      {tableName:string} must have unique {fieldName:string} in
      {parentField:string}
    `,
    'es-es': `
      {tableName:string} debe tener un único {fieldName:string} en
      {parentField:string}
    `,
    'fr-fr': `
      {tableName:string} doit avoir un {fieldName:string} unique dans
      {parentField:string}
    `,
    'ru-ru': `
      {tableName:string} должен иметь уникальный {fieldName:string} в
      {parentField:string}
    `,
    'uk-ua': `
      {tableName:string} повинен мати унікальний {fieldName:string} у
      {parentField:string}
    `,
  },
  deletingTreeRoot: {
    'en-us': 'Can not delete root level tree definition item',
    'es-es':
      'No se puede eliminar el elemento de definición del árbol de nivel raíz',
    'fr-fr': `
      Impossible de supprimer l'élément de définition d'arborescence de niveau
      racine
    `,
    'ru-ru': 'Невозможно удалить элемент определения дерева корневого уровня',
    'uk-ua': 'Неможливо видалити елемент визначення дерева кореневого рівня',
  },
  nodeParentInvalidRank: {
    'en-us': "Tree node's parent has rank greater than itself",
    'es-es': 'El padre del nodo del árbol tiene un rango mayor que él mismo',
    'fr-fr': "Le parent du nœud de l'arbre a un rang supérieur à lui-même",
    'ru-ru': 'Родительский элемент узла дерева имеет ранг выше, чем он сам',
    'uk-ua': 'Батьківський вузол дерева має ранг, вищий за нього самого',
  },
  nodeChildrenInvalidRank: {
    'en-us': "Tree node's rank is greater than some of its children",
    'es-es':
      'El rango del nodo del árbol es mayor que el de algunos de sus hijos',
    'fr-fr': `
      Le rang du nœud de l'arbre est supérieur à celui de certains de ses
      enfants
    `,
    'ru-ru': 'Ранг узла дерева больше, чем у некоторых его дочерних элементов',
    'uk-ua': 'Ранг вузла дерева більший, ніж у деяких його дочірніх вузлів',
  },
  nodeOperationToSynonymizedParent: {
    'en-us': `
      {operation:string} node '{nodeName:string}' to synonymized parent
      '{parentName:string}'
    `,
    'es-es': `
      {operation:string} nodo '{nodeName:string}' a padre sinónimo
      '{parentName:string}'
    `,
    'fr-fr': `
      {operation:string} nœud '{nodeName:string}' vers le parent synonyme
      '{parentName:string}'
    `,
    'ru-ru': `
      {operation:string} узел '{nodeName:string}' для синонимизированного
      родителя '{parentName:string}'
    `,
    'uk-ua': `
      {operation:string} вузол '{nodeName:string}' до синонімічного
      батьківського елемента '{parentName:string}'
    `,
  },
  nodeSynonymizeToSynonymized: {
    'en-us': `
      Synonymizing '{nodeName:string}' to synonymized node '{intoName:string}'
    `,
    'es-es':
      "Sinonimizar '{nodeName:string}' al nodo sinónimo '{intoName:string}'",
    'fr-fr': `
      Synonymisation de '{nodeName:string}' en nœud synonyme '{intoName:string}'
    `,
    'ru-ru': `
      Синонимизация '{nodeName:string}' к синонимизированному узлу
      '{intoName:string}'
    `,
    'uk-ua': `
      Синонімізація '{nodeName:string}' до синонімічного вузла
      '{intoName:string}'
    `,
  },
  nodeSynonimizeWithChildren: {
    'en-us': "Synonimizing node '{nodeName:string}' which has children",
    'es-es': "Sinonimizando el nodo '{nodeName:string}' que tiene hijos",
    'fr-fr': "Synonymiser le nœud '{nodeName:string}' qui a des enfants",
    'ru-ru': "Синонимизация узла '{nodeName:string}' с дочерними элементами",
    'uk-ua': "Синонімізуючий вузол '{nodeName:string}', який має дітей",
  },
  badTreeStructureInvalidRanks: {
    'en-us': `
      Bad Tree Structure: Found {badRanks:number} cases where node rank is not
      greater than its parent
    `,
    'es-es': `
      Estructura de árbol incorrecta: casos encontrados {badRanks:number} donde
      el rango del nodo no es mayor que su padre
    `,
    'fr-fr': `
      Mauvaise structure d'arborescence : {badRanks:number} cas trouvés où le
      rang du nœud n'est pas supérieur à celui de son parent
    `,
    'ru-ru': `
      Плохая древовидная структура: найдено {badRanks:number} случаев, когда
      ранг узла не выше, чем у его родителя.
    `,
    'uk-ua': `
      Погана структура дерева: знайдено {badRanks:number} випадків, коли ранг
      вузла не перевищує його батьківського рівня
    `,
  },
  invalidNodeType: {
    'en-us': `
      Unexpected type of node '{node:string}' during {operation:string}.
      Expected '{nodeModel:string}'
    `,
    'es-es': `
      Tipo inesperado de nodo '{node:string}' durante {operation:string}. Se
      esperaba '{nodeModel:string}'
    `,
    'fr-fr': `
      Type de nœud '{node:string}' inattendu pendant
      {operation:string}. '{nodeModel:string}' attendu
    `,
    'ru-ru': `
      Неожиданный тип узла '{node:string}' во время {operation:string}.
      Ожидается '{nodeModel:string}'
    `,
    'uk-ua': `
      Неочікуваний тип вузла '{node:string}' під час {operation:string}.
      Очікується '{nodeModel:string}'
    `,
  },
  mergeAcrossTrees: {
    'en-us': 'Merging across trees',
    'es-es': 'Fusión a través de los árboles',
    'fr-fr': 'Fusionner à travers les arbres',
    'ru-ru': 'Слияние деревьев',
    'uk-ua': 'Злиття між деревами',
  },
  synonymizeAcrossTrees: {
    'en-us': 'Synonymizing across trees',
    'es-es': 'Sinonimizar entre árboles',
    'fr-fr': 'Synonymisation à travers les arbres',
    'ru-ru': 'Синонимизация деревьев',
    'uk-ua': 'Синонімізація між деревами',
  },
  limitReachedDeterminingAccepted: {
    'en-us': `
      Could not find accepted taxon for synonymized taxon (id
      = {taxonId:number})
    `,
    'es-es': `
      No se pudo encontrar el taxón aceptado para el taxón sinónimo (id
      = {taxonId:number})
    `,
    'fr-fr': `
      Impossible de trouver le taxon accepté pour le taxon synonymisé (id
      = {taxonId:number})
    `,
    'ru-ru': `
      Не удалось найти принятый таксон для синонимизированного таксона (id
      = {taxonId:number})
    `,
    'uk-ua': `
      Не вдалося знайти прийнятний таксон для синонімічного таксону (id
      = {taxonId:number})
    `,
  },
  resourceInPermissionRegistry: {
    'en-us': 'Resource {resource:string} already in Permissions registry',
    'es-es': 'Recurso {resource:string} ya en el registro de permisos',
    'fr-fr':
      'Ressource {resource:string} déjà dans le registre des autorisations',
    'ru-ru': 'Ресурс {resource:string} уже в реестре разрешений',
    'uk-ua': 'Ресурс {resource:string} уже в реєстрі дозволів',
  },
  actorIsNotSpecifyUser: {
    'en-us': 'Agent {actor:string} is not a SpecifyUser',
    'es-es': 'El agente {actor:string} no es un usuario especificado',
    'fr-fr': "L'agent {actor:string} n'est pas un utilisateur spécifié",
    'ru-ru': 'Агент {actor:string} не является SpecifyUser',
    'uk-ua': 'Агент {actor:string} не є SpecifyUser',
  },
  unexpectedCollectionType: {
    'en-us': `
      Unexpected type of collection '{unexpectedTypeName:string}'. Expected
      '{collectionName:string}'
    `,
    'es-es': `
      Tipo inesperado de colección '{unexpectedTypeName:string}'. Se esperaba
      '{nombre_colección:cadena}'
    `,
    'fr-fr': `
      Type de collection inattendu
      '{unexpectedTypeName:string}'. '{collectionName:string}' attendu
    `,
    'ru-ru': `
      Неожиданный тип коллекции "{unexpectedTypeName:string}". Ожидается
      \'{collectionName:string}\'
    `,
    'uk-ua': `
      Неочікуваний тип колекції "{unexpectedTypeName:string}". Очікується
      \'{collectionName:string}\'
    `,
  },
  invalidReportMimetype: {
    'en-us':
      "Can not create report: mimetype not 'jrxml/label' or 'jrxml/report'",
    'es-es': `
      No se puede crear el informe: mimetype no es 'jrxml/label' o
      'jrxml/report'
    `,
    'fr-fr': `
      Impossible de créer le rapport : type MIME différent de 'jrxml/label' ou
      'jrxml/report'
    `,
    'ru-ru': `
      Невозможно создать отчет: mimetype отличается от «jrxml/label» или
      «jrxml/report»
    `,
    'uk-ua':
      'Неможливо створити звіт: тип mime не "jrxml/label" або "jrxml/report"',
  },
  fieldNotRelationship: {
    'en-us': 'Field {field:string} is not a Relationship',
    'es-es': 'El campo {field:string} no es una relación',
    'fr-fr': "Le champ {field:string} n'est pas une relation",
    'ru-ru': 'Поле {field:string} не является отношением',
    'uk-ua': 'Поле {field:string} не є зв’язком',
  },
  unexpectedTableId: {
    'en-us': `
      Unexpected table id '{tableId:string}' in request. Expected
      '{expectedTableId:string}'
    `,
    'es-es': `
      ID de tabla inesperado '{tableId:string}' en la solicitud. Se esperaba
      '{expectedTableId:string}'
    `,
    'fr-fr': `
      ID de table inattendu '{tableId:string}' dans la
      demande. '{expectedTableId:string}' attendu
    `,
    'ru-ru': `
      Неожиданный идентификатор таблицы '{tableId:string}' в запросе. Ожидается
      '{expectedTableId:string}'
    `,
    'uk-ua': `
      Неочікуваний ідентифікатор таблиці "{tableId:string}" у запиті. Очікується
      \'{expectedTableId:string}\'
    `,
  },
  noCollectionInQuery: {
    'en-us': 'No Collection found in Query for table {table:string}',
    'es-es': `
      No se encontró ninguna colección en la consulta de la tabla {table:string}
    `,
    'fr-fr':
      'Aucune collection trouvée dans la requête pour la table {table:string}',
    'ru-ru': 'Коллекция не найдена в запросе для таблицы {table:string}',
    'uk-ua': 'У запиті для таблиці {table:string} колекція не знайдена',
  },
  invalidDatePart: {
    'en-us': `
      Invalid date part '{datePart:string}'. Expected one of
      {validDateParts:string}
    `,
    'es-es': `
      Parte de fecha no válida '{datePart:string}'. Esperaba uno de
      {validDateParts:string}
    `,
    'fr-fr': `
      Partie de date non valide '{datePart:string}'. Attendu l'un des
      {validDateParts:string}
    `,
    'ru-ru': `
      Недопустимая часть даты '{datePart:string}'. Ожидается один из
      {validDateParts:string}
    `,
    'uk-ua': `
      Недійсна частина дати "{datePart:string}". Очікується один із
      {validDateParts:string}
    `,
  },
  invalidUploadStatus: {
    'en-us': `
      Invalid status '{uploadStatus:string}' for {operation:string}. Expected
      {expectedUploadStatus:string}
    `,
    'es-es': `
      Estado no válido '{uploadStatus:string}' para {operation:string}. Esperado
      {expectedUploadStatus:string}
    `,
    'fr-fr': `
      Statut '{uploadStatus:string}' non valide pour {operation:string}. Attendu
      {expectedUploadStatus:string}
    `,
    'ru-ru': `
      Неверный статус '{uploadStatus:string}' для {operation:string}. Ожидается
      {expectedUploadStatus:string}
    `,
    'uk-ua': `
      Недійсний статус "{uploadStatus:string}" для {operation:string}.
      Очікується {expectedUploadStatus:string}
    `,
  },
  datasetAlreadyUploaded: {
    'en-us': 'Dataset already uploaded',
    'es-es': 'Conjunto de datos ya subido',
    'fr-fr': 'Ensemble de données déjà chargé',
    'ru-ru': 'Набор данных уже загружен',
    'uk-ua': 'Набір даних уже завантажено',
  },
} as const);
