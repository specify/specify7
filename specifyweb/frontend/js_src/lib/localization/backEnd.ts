/**
 * Localization for strings that are returned from the back-end. (back-end
 * returns a key, and front-end resolves the key into a string)
 *
 * @module
 */

import { createDictionary } from "./utils";

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const backEndText = createDictionary({
  failedParsingBoolean: {
    "en-us": 'value "{value:string}" not resolvable to True or False',
    "ru-ru": 'значение "{value:string}" не разрешается to True or False',
    "es-es":
      'el valor "{value:string}" no se puede resolver en Verdadero o Falso',
    "fr-fr": 'Valeur "{value:string}"  non résolvable en Vrai ou Faux',
    "uk-ua": 'значення "{value:string}" не являється "True" або "False"',
    "de-ch":
      "Wert „{value:string}“ kann nicht in „True“ oder „False“ aufgelöst werden",
    "pt-br":
      'valor "{value:string}" não pode ser resolvido como Verdadeiro ou Falso',
  },
  failedParsingDecimal: {
    "en-us": 'value "{value:string}" is not a valid decimal value',
    "ru-ru": 'значение "{value:string}" не является допустимым чеслом',
    "es-es": 'El valor "{value:string}" no es un valor decimal válido',
    "fr-fr": 'valeur "{value:string}" n\'est pas une valeur décimale valide',
    "uk-ua": 'значення "{value:string}" не є дійсним цілим числом',
    "de-ch": '"{value:string}" ist kein gültiger Dezimalwert',
    "pt-br": 'o valor "{value:string}" não é um valor decimal válido',
  },
  failedParsingFloat: {
    "en-us": 'value "{value:string}" is not a valid floating point value',
    "ru-ru":
      'значение "{value:string}" не является допустимым числом с плавающей точкой',
    "es-es": 'El valor "{value:string}" no es un valor de coma flotante válido',
    "fr-fr":
      'valeur "{value:string}" n\'est pas une valeur à virgule flottante valide',
    "uk-ua": 'значення "{value:string}" не є раціональним числом',
    "de-ch": '"{value:string}" ist kein gültiger Gleitkommawert',
    "pt-br":
      'o valor "{value:string}" não é um valor de ponto flutuante válido',
  },
  failedParsingPickList: {
    "en-us":
      "{value:string} is not a legal value in this picklist field.\n\nClick on the arrow to choose among available options.",
    "ru-ru":
      "{value:string} не является допустимым значением в этом списке.\n\nНажмите на стрелку, чтобы выбрать один из доступных вариантов.",
    "es-es":
      "{value:string} no es un valor legal en este campo de lista de selección.\n\nHaga clic en la flecha para elegir entre las opciones disponibles.",
    "fr-fr":
      "{value:string} n'est pas une valeur acceptée dans ce champ de liste de sélection.\n\nCliquez sur la flèche pour choisir parmi les options disponibles.",
    "uk-ua":
      "{value:string} не є допустимим значенням у цьому полі списку вибору.\n\nНатисніть на стрілку, щоб вибрати серед доступних варіантів.",
    "de-ch":
      "{value:string} ist in diesem Auswahllistenfeld kein zulässiger Wert.\n\nKlicken Sie auf den Pfeil, um zwischen den verfügbaren Optionen zu wählen.",
    "pt-br":
      "{value:string} não é um valor válido neste campo da lista de opções.\n\nClique na seta para escolher entre as opções disponíveis.",
  },
  failedParsingAgentType: {
    comment: `
      Example: bad agent type: "ab". Expected one of "Person", "Group" or
      "Organization"
    `,
    "en-us":
      'bad {agentTypeField:string}: "{badType:string}". Expected one of {validTypes:string}',
    "ru-ru":
      'неверный {agentTypeField:string}: "{badType:string}". Ожидается один из {validTypes:string}',
    "es-es":
      'malo {agentTypeField:string}: "{badType:string}". Se esperaba uno de {validTypes:string}',
    "fr-fr":
      '{agentTypeField:string} non valide: "{badType:string}". L\'un des {validTypes:string} est attendu',
    "uk-ua":
      'поганий {agentTypeField:string}: "{badType:string}". Очікується один із {validTypes:string}',
    "de-ch":
      'fehlerhaft {agentTypeField:string}: "{badType:string}". Erwartet wurde einer von {validTypes:string}',
    "pt-br":
      'ruim {agentTypeField:string}: "{badType:string}". Esperava um de {validTypes:string}',
  },
  pickListValueTooLong: {
    "en-us":
      "value from {pickListTable:string} {pickList:string} longer than the max of {maxLength:number|formatted} for field",
    "ru-ru":
      "значение из {pickListTable:string} {pickList:string} длиннее максимального значения {maxLength:number|formatted} для поля",
    "es-es":
      "valor de {pickListTable:string} {pickList:string} más largo que el máximo de {maxLength:number|formatted} para el campo",
    "fr-fr":
      "valeur de {pickListTable:string} {pickList:string} est plus longue que le maximum de {maxLength:number|formatted} pour le champ",
    "uk-ua":
      "значення з {pickListTable:string} {pickList:string} довше, ніж максимальне значення {maxLength:number|formatted} для поля",
    "de-ch":
      "Wert von {pickListTable:string} {pickList:string} länger als das Maximum von {maxLength:number|formatted} für das Feld",
    "pt-br":
      "valor de {pickListTable:string} {pickList:string} maior que o máximo de {maxLength:number|formatted} para o campo",
  },
  valueTooLong: {
    "en-us":
      "value must not have length greater than {maxLength:number|formatted}",
    "ru-ru": "значение не должно быть длиннее {maxLength:number|formatted}",
    "es-es":
      "el valor no debe tener una longitud mayor que {maxLength:number|formatted}",
    "fr-fr":
      "la valeur ne doit pas avoir une longueur supérieure à {maxLength:number|formatted}",
    "uk-ua":
      "довжина значення не повинна перевищувати {maxLength:number|formatted}",
    "de-ch":
      "Der Wert darf nicht länger als {maxLength:number|formatted} sein.",
    "pt-br":
      "o valor não deve ter comprimento maior que {maxLength:number|formatted}",
  },
  invalidYear: {
    "en-us": "date value must contain four digit year: {value:string}",
    "ru-ru":
      "значение даты должно содержать четырехзначный год: {value:string}",
    "es-es":
      "el valor de fecha debe contener el año de cuatro dígitos: {value:string}",
    "fr-fr":
      "la valeur de la date doit contenir quatre chiffres pour l'année {value:string}",
    "uk-ua": "дата має містити чотири цифри року: {value:string}",
    "de-ch":
      "Datumswert muss vierstellige Jahreszahlen enthalten: {value:string}",
    "pt-br":
      "o valor da data deve conter o ano de quatro dígitos: {value:string}",
  },
  badDateFormat: {
    "en-us": "bad date value: {value:string}. expected: {format:string}",
    "ru-ru":
      "неверное значение даты: {value:string}. ожидается: {format:string}",
    "es-es":
      "valor de fecha incorrecto: {value:string}. se esperaba: {format:string}",
    "fr-fr":
      "valeur de date invalide: {value:string}. {format:string} est attendu",
    "uk-ua":
      "неправильне значення дати: {value:string}. очікуваний формат: {format:string}",
    "de-ch": "Ungültiger Datumswert: {value:string}. Erwartet: {format:string}",
    "pt-br":
      "valor de data inválido: {value:string}. esperado: {format:string}",
  },
  coordinateBadFormat: {
    "en-us": "bad latitude or longitude value: {value:string}",
    "ru-ru": "неверное значение широты или долготы: {value:string}",
    "es-es": "valor de latitud o longitud incorrecto: {value:string}",
    "fr-fr": 'Nœud [X0X] "[X25X]" vers le parent synonymisé "[X67X]"',
    "uk-ua": "неправильне значення широти або довготи: {value:string}",
    "de-ch": "falscher Breiten- oder Längengradwert: {value:string}",
    "pt-br": "valor incorreto de latitude ou longitude: {value:string}",
  },
  latitudeOutOfRange: {
    "en-us": "latitude must be between -90 and 90. Actual: {value:string}",
    "ru-ru": "широта должна быть между -90 и 90. Фактически: {value:string}",
    "es-es": "la latitud debe estar entre -90 y 90. Actual: {value:string}",
    "fr-fr":
      "la latitude doit être comprise entre -90 et 90. Réel : {value:string}",
    "uk-ua": "широта має бути між -90 і 90. Поточна: {value:string}",
    "de-ch":
      "Der Breitengrad muss zwischen -90 und 90 liegen. Tatsächlich: {value:string}",
    "pt-br": "a latitude deve estar entre -90 e 90. Real: {value:string}",
  },
  longitudeOutOfRange: {
    "en-us": "longitude must be between -180 and 180. Actual: {value:string}",
    "ru-ru": "долгота должна быть между -180 и 180. Фактически: {value:string}",
    "es-es": "la longitud debe estar entre -180 y 180. Actual: {value:string}",
    "fr-fr":
      "la longitude doit être comprise entre -180 et 180. Réel : {value:string}",
    "uk-ua": "довгота має бути між -180 і 180. Поточна: {value:string}",
    "de-ch":
      "Der Längengrad muss zwischen -180 und 180 liegen. Tatsächlich: {value:string}",
    "pt-br": "a longitude deve estar entre -180 e 180. Real: {value:string}",
  },
  formatMismatch: {
    "en-us": "value {value:string} does not match formatter {formatter:string}",
    "de-ch":
      "Wert {value:string} stimmt nicht mit Formatierer {formatter:string} überein",
    "es-es":
      "El valor {value:string} no coincide con el formateador {formatter:string}",
    "fr-fr":
      "la valeur {value:string} ne correspond pas au formateur {formatter:string}",
    "ru-ru":
      "значение {value:string} не соответствует форматеру {formatter:string}",
    "uk-ua": "значення {value:string} не відповідає формату {formatter:string}",
    "pt-br":
      "valor {value:string} não corresponde ao formatador {formatter:string}",
  },
  invalidPartialRecord: {
    "en-us": "this field must be empty if {column:string} is empty",
    "ru-ru": "это поле должно быть пустым, если {column:string} пусто",
    "es-es": "este campo debe estar vacío si {column:string} está vacío",
    "fr-fr": "ce champ doit être vide si {column:string} est vide",
    "uk-ua": "це поле має бути порожнім, якщо {column:string} є порожнім",
    "de-ch": "dieses Feld muss leer sein, wenn {column:string} leer ist",
    "pt-br": "este campo deve estar vazio se {column:string} estiver vazio",
  },
  fieldRequiredByUploadPlan: {
    "en-us": "field is required by upload plan mapping",
    "ru-ru": "поле обязательно для загрузки плана",
    "es-es": "el campo es obligatorio para la asignación del plan de mapeo",
    "fr-fr": "le champ est requis par le mappage du plan de téléchargement",
    "uk-ua": "це поле є обов’язковим (згідно з визначенням)",
    "de-ch": "Das Feld ist für die Upload-Planzuordnung erforderlich",
    "pt-br": "campo é obrigatório para mapeamento do plano de upload",
  },
  invalidTreeStructure: {
    "en-us": 'There are multiple "Uploaded" placeholder values in the tree!',
    "ru-ru": 'В дереве есть несколько веток с именем "Uploaded"!',
    "es-es":
      '¡Hay varios valores de marcador de posición "Subidos" en el árbol!',
    "fr-fr":
      "Il existe plusieurs valeurs d'espace réservé « Téléchargé » dans l'arborescence !",
    "uk-ua": 'У дереві є кілька вузлів з назвою "Uploaded"!',
    "de-ch": "Es gibt mehrere „Hochgeladene“ Platzhalterwerte im Baum!",
    "pt-br": 'Há vários valores de espaço reservado "Carregado" na árvore!',
  },
  missingRequiredTreeParent: {
    "en-us":
      'Missing or unmapped required tree parent rank value for "{names:string}".',
    "ru-ru":
      'Отсутствует или не сопоставлено необходимое значение родительского ранга для дерева "{names:string}".',
    "es-es":
      'Falta o no está asignado el valor requerido del rango del padre en el árbol para "{names:string}".',
    "fr-fr":
      "Valeur de classement parent de l'arborescence requise manquante ou non mappée pour « {names:string} ».",
    "uk-ua":
      'Відсутнє або не зіставлене необхідне значення батьківського рангу дерева для "{names:string}".',
    "de-ch":
      "Fehlender oder nicht zugeordneter erforderlicher Rangwert des übergeordneten Baums für „{names:string}“.",
    "pt-br":
      'Valor de classificação da árvore pai necessária ausente ou não mapeada para "{names:string}".',
  },
  showTraceback: {
    "en-us": "Show Traceback",
    "es-es": "Mostrar seguimiento",
    "fr-fr": "Afficher le traçage",
    "ru-ru": "Показать трассировку",
    "uk-ua": "Показати помилку",
    "de-ch": "Traceback anzeigen",
    "pt-br": "Mostrar rastreamento",
  },
  fieldNotUnique: {
    "en-us": "{tableName:string} must have unique {fieldName:string}",
    "es-es": "{tableName:string} debe tener un {fieldName:string} único",
    "fr-fr": 'Type de collection inattendu "[X31X]". "[X71X]" attendu',
    "ru-ru": "{tableName:string} должно иметь уникальное {fieldName:string}",
    "uk-ua": "{tableName:string} має мати унікальний {fieldName:string}",
    "de-ch": "{tableName:string} muss eindeutig sein {fieldName:string}",
    "pt-br": "{tableName:string} deve ter {fieldName:string} exclusivo",
  },
  childFieldNotUnique: {
    "en-us":
      "{tableName:string} must have unique {fieldName:string} in {parentField:string}",
    "es-es":
      "{tableName:string} debe tener un {fieldName:string} único en {parentField:string}",
    "fr-fr":
      "{tableName:string} doit avoir un {fieldName:string} unique dans {parentField:string}",
    "ru-ru":
      "{tableName:string} должно иметь уникальное {fieldName:string} в {parentField:string}",
    "uk-ua":
      '{tableName:string} повинен мати унікальний "{fieldName:string}" у "{parentField:string}"',
    "de-ch":
      "{tableName:string} muss eindeutiges {fieldName:string} in {parentField:string} haben",
    "pt-br":
      "{tableName:string} deve ter {fieldName:string} exclusivo em {parentField:string}",
  },
  deletingTreeRoot: {
    "en-us": "Can not delete root level tree definition item",
    "es-es":
      "No se puede eliminar la definición del elemento de nivel raíz del árbol",
    "fr-fr":
      "Impossible de supprimer l'élément de définition de l'arborescence au niveau racine",
    "ru-ru": "Невозможно удалить элемент определения дерева корневого уровня.",
    "uk-ua": "Неможливо видалити корінь дерева",
    "de-ch":
      "Das Baumdefinitionselement auf Stammebene kann nicht gelöscht werden",
    "pt-br":
      "Não é possível excluir o item de definição da árvore de nível raiz",
  },
  nodeParentInvalidRank: {
    "en-us": "Tree node's parent has rank greater than itself",
    "es-es": "El padre de un nodo del árbol tiene un rango mayor que él mismo",
    "fr-fr": "Le parent du nœud d'arbre a un rang supérieur à lui-même",
    "ru-ru": "Родительский узел дерева имеет ранг выше, чем он сам.",
    "uk-ua": "Батько вузла дерева має ранг, вищий за нього самого",
    "de-ch":
      "Der übergeordnete Knoten des Baumknotens hat einen höheren Rang als er selbst",
    "pt-br": "O nó pai da árvore tem classificação maior que ele mesmo",
  },
  nodeChildrenInvalidRank: {
    "en-us": "Tree node's rank is greater than some of its children",
    "es-es":
      "El rango de un nodo del árbol es mayor que el de alguno de sus hijos",
    "fr-fr":
      "Le rang du nœud d'arbre est supérieur à celui de certains de ses enfants",
    "ru-ru": "Ранг узла дерева больше, чем у некоторых его дочерних узлов.",
    "uk-ua": "Ранг вузла дерева більший, ніж у деяких його дочірніх вузлів",
    "de-ch":
      "Der Rang des Baumknotens ist höher als der einiger seiner untergeordneten Knoten",
    "pt-br":
      "A classificação do nó da árvore é maior que a de alguns de seus filhos",
  },
  nodeOperationToSynonymizedParent: {
    "en-us":
      '{operation:string} node "{nodeName:string}" to synonymized parent "{parentName:string}"',
    "es-es":
      '{operation:string} nodo "{nodeName:string}" al padre sinonimizado "{parentName:string}"',
    "fr-fr":
      "{operation:string} nœud « {nodeName:string} » vers le parent synonymisé « {parentName:string} »",
    "uk-ua":
      '{operation:string} вузол "{nodeName:string}" до синонімічного батьківського елемента "{parentName:string}"',
    "de-ch":
      '{operation:string} Knoten "{nodeName:string}" zum synonymisierten übergeordneten Knoten "{parentName:string}"',
    "ru-ru":
      '{operation:string} узел "{nodeName:string}" к синонимизированному родительскому элементу "{parentName:string}"',
    "pt-br":
      '{operation:string} nó "{nodeName:string}" para pai sinonimizado "{parentName:string}"',
  },
  nodeSynonymizeToSynonymized: {
    "en-us":
      'Synonymizing "{nodeName:string}" to synonymized node "{intoName:string}"',
    "es-es":
      'Sinonimizando "{nodeName:string}" al nodo sinonimizado "{intoName:string}"',
    "fr-fr":
      'Synonymisation de "{nodeName:string}" en nœud synonymisé "{intoName:string}"',
    "ru-ru":
      "Синонимизация «{nodeName:string}» в синонимизированный узел «{intoName:string}»",
    "uk-ua":
      'Синонімізація "{nodeName:string}" до синоніма "{intoName:string}"',
    "de-ch":
      'Synonymisierung von "{nodeName:string}" zum synonymisierten Knoten "{intoName:string}"',
    "pt-br":
      'Sinonimizando "{nodeName:string}" para o nó sinonimizado "{intoName:string}"',
  },
  nodeSynonimizeWithChildren: {
    "en-us": 'Synonymizing node "{nodeName:string}" which has children',
    "es-es": 'Sinonimizando el nodo "{nodeName:string}" que tiene hijos',
    "fr-fr": 'Type de collection inattendu "[X31X]". "[X71X]" attendu',
    "ru-ru":
      "Синонимизация узла «{nodeName:string}», имеющего дочерние элементы",
    "uk-ua": 'Синонімується вузол "{nodeName:string}", який має дітей',
    "de-ch":
      "Synonymisierender Knoten „{nodeName:string}“, der untergeordnete Knoten hat",
    "pt-br": 'Sinonímia do nó "{nodeName:string}" que tem filhos',
  },
  badTreeStructureInvalidRanks: {
    "en-us":
      "Bad Tree Structure: Found {badRanks:number|formatted} cases where node rank is not greater than its parent",
    "es-es":
      "Estructura de árbol incorrecta: se encontraron {badRanks:number|formatted} casos en los que el rango del nodo no es mayor que el de su padre",
    "fr-fr":
      "Mauvaise structure d'arborescence : cas {badRanks:number|formatted} trouvés où le rang du nœud n'est pas supérieur à celui de son parent",
    "ru-ru":
      "Плохая структура дерева: обнаружено {badRanks:number|formatted} случаев, когда ранг узла не превышает ранг его родителя.",
    "uk-ua":
      "Погана структура дерева: знайдено {badRanks:number|formatted} випадків, коли ранг вузла не перевищує його батьківського рівня",
    "de-ch":
      "Fehlerhafte Baumstruktur: Es wurden {badRanks:number|formatted} Fälle gefunden, in denen der Rang eines Knotens nicht größer ist als der seines übergeordneten Knotens",
    "pt-br":
      "Estrutura de árvore ruim: foram encontrados {badRanks:number|formatted} casos em que a classificação do nó não é maior que a do seu pai",
  },
  invalidNodeType: {
    "en-us":
      'Unexpected type of node "{node:string}" during {operation:string}. Expected "{nodeModel:string}"',
    "es-es":
      'Tipo de nodo inesperado "{node:string}" durante {operation:string}. Se esperaba "{nodeModel:string}"',
    "fr-fr":
      'Type inattendu de nœud "{node:string}" pendant {operation:string}. "{nodeModel:string}" attendu',
    "ru-ru":
      "Неожиданный тип узла «{node:string}» во время {operation:string}. Ожидалось «{nodeModel:string}».",
    "uk-ua":
      'Неочікуваний тип вузла "{node:string}" під час {operation:string}. Очікується "{nodeModel:string}"',
    "de-ch":
      'Unerwarteter Knotentyp "{node:string}" während {operation:string}. Erwartet "{nodeModel:string}"',
    "pt-br":
      'Tipo inesperado de nó "{node:string}" durante {operation:string}. Esperado "{nodeModel:string}"',
  },
  operationAcrossTrees: {
    "en-us": "{operation:string} across trees",
    "de-ch": "{operation:string} über Bäume",
    "es-es": "{operation:string} a través de los árboles",
    "fr-fr": "{operation:string} à travers les arbres",
    "ru-ru": "{operation:string} через деревья",
    "uk-ua": "{operation:string} поміж деревами",
    "pt-br": "{operation:string} através das árvores",
  },
  limitReachedDeterminingAccepted: {
    "en-us":
      "Could not find accepted taxon for synonymized taxon with ID of {taxonId:number}",
    "es-es":
      "No se pudo encontrar el taxón válido para el taxón sinonimizado con ID {taxonId:number}",
    "fr-fr":
      "Impossible de trouver un taxon accepté pour le taxon synonymisé avec l'ID {taxonId:number}",
    "ru-ru":
      "Не удалось найти принятый таксон для синонимизированного таксона с идентификатором {taxonId:number}",
    "uk-ua":
      "Не вдалося знайти прийнятий таксон для синоніма (ІД: {taxonId:number})",
    "de-ch":
      "Für das synonymisierte Taxon mit der ID {taxonId:number} konnte kein akzeptiertes Taxon gefunden werden.",
    "pt-br":
      "Não foi possível encontrar o táxon aceito para o táxon sinonimizado com ID de {taxonId:number}",
  },
  resourceInPermissionRegistry: {
    "en-us": "Resource {resource:string} already in Permissions registry",
    "es-es": "El recurso {resource:string} ya está en el registro de permisos",
    "fr-fr":
      "Ressource {resource:string} déjà dans le registre des autorisations",
    "ru-ru": "Ресурс {resource:string} уже в реестре разрешений",
    "uk-ua": "Ресурс {resource:string} уже є в реєстрі дозволів",
    "de-ch":
      "Ressource {resource:string} bereits in der Berechtigungsregistrierung",
    "pt-br": "Recurso {resource:string} já no registro de permissões",
  },
  actorIsNotSpecifyUser: {
    comment: 'Agent "Abc" is not a Specify User',
    "en-us":
      "{agentTable:string} {actor:string} is not a {specifyUserTable:string}",
    "es-es":
      "{agentTable:string} {actor:string} no es un {specifyUserTable:string}",
    "fr-fr":
      "{agentTable:string} {actor:string} n'est pas un {specifyUserTable:string}",
    "ru-ru":
      "{agentTable:string} {actor:string} не является {specifyUserTable:string}",
    "uk-ua":
      "{agentTable:string} {actor:string} не є {specifyUserTable:string}",
    "de-ch":
      "{agentTable:string} {actor:string} ist kein {specifyUserTable:string}",
    "pt-br":
      "{agentTable:string} {actor:string} não é um {specifyUserTable:string}",
  },
  unexpectedCollectionType: {
    "en-us":
      'Unexpected type of collection "{unexpectedTypeName:string}". Expected "{collectionName:string}"',
    "es-es":
      'Tipo de colección "{unexpectedTypeName:string}" inesperado. Se esperaba "{collectionName:string}"',
    "fr-fr":
      'Type de collection inattendu "{unexpectedTypeName:string}". "{collectionName:string}" attendu',
    "ru-ru":
      "Неожиданный тип коллекции «{unexpectedTypeName:string}». Ожидалось «{collectionName:string}».",
    "uk-ua":
      'Неочікуваний тип колекції "{unexpectedTypeName:string}". Очікується "{collectionName:string}"',
    "de-ch":
      'Unerwarteter Typ der Sammlung "{unexpectedTypeName:string}". Erwartet "{collectionName:string}"',
    "pt-br":
      'Tipo inesperado de coleta "{unexpectedTypeName:string}". Esperado "{collectionName:string}"',
  },
  invalidReportMimetype: {
    "en-us":
      'Can not create report: {mimeTypeField:string} is not one of "jrxml/label" or "jrxml/report"',
    "es-es":
      'No se puede crear el informe: {mimeTypeField:string} no es uno de "jrxml/label" o "jrxml/report"',
    "fr-fr":
      'Impossible de créer un rapport : {mimeTypeField:string} n\'est pas l\'un des "jrxml/label" ou "jrxml/report"',
    "ru-ru":
      "Невозможно создать отчёт: {mimeTypeField:string} не является ни «jrxml/label», ни «jrxml/report».",
    "uk-ua":
      'Не вдається створити звіт: {mimeTypeField:string} має бути "jrxml/label" або "jrxml/report"',
    "de-ch":
      'Bericht kann nicht erstellt werden: {mimeTypeField:string} ist weder "jrxml/label" noch "jrxml/report"',
    "pt-br":
      'Não é possível criar o relatório: {mimeTypeField:string} não é um dos "jrxml/label" ou "jrxml/report"',
  },
  fieldNotRelationship: {
    "en-us": "Field {field:string} is not a Relationship",
    "es-es": "El campo {field:string} no es una relación",
    "fr-fr": "Le champ {field:string} n'est pas une relation",
    "ru-ru": "Поле {field:string} не является отношением",
    "uk-ua": "Поле {field:string} не є зв’язком",
    "de-ch": "Feld {field:string} ist keine Beziehung",
    "pt-br": "Campo {field:string} não é um relacionamento",
  },
  unexpectedTableId: {
    "en-us":
      'Unexpected table id "{tableId:string}" in request. Expected "{expectedTableId:string}"',
    "es-es":
      'ID de tabla inesperado "{tableId:string}" en la solicitud. Se esperaba "{expectedTableId:string}"',
    "fr-fr":
      'ID de table inattendu "{tableId:string}" dans la demande. "{expectedTableId:string}" attendu',
    "ru-ru":
      "Неожиданный идентификатор таблицы «{tableId:string}» в запросе. Ожидается «{expectedTableId:string}».",
    "uk-ua":
      'Неочікуваний ІД таблиці "{tableId:string}" у запиті. Очікується "{expectedTableId:string}"',
    "de-ch":
      'Unerwartete Tabellen-ID "{tableId:string}" in der Anfrage. Erwartet wurde "{expectedTableId:string}".',
    "pt-br":
      'ID de tabela inesperado "{tableId:string}" na solicitação. Esperado "{expectedTableId:string}"',
  },
  noCollectionInQuery: {
    "en-us": "No Collection found in Query for table {table:string}",
    "es-es":
      "No se encontró ninguna colección en la consulta de la tabla {table:string}",
    "fr-fr":
      "Aucune collection trouvée dans la requête pour la table {table:string}",
    "ru-ru":
      "В запросе для таблицы {table:string} не найдено ни одной коллекции",
    "uk-ua": "У запиті для таблиці {table:string} колекція не знайдена",
    "de-ch":
      "Keine Sammlung in der Abfrage für Tabelle {table:string} gefunden",
    "pt-br":
      "Nenhuma coleção encontrada na consulta para a tabela {table:string}",
  },
  invalidDatePart: {
    "en-us":
      'Invalid date part "{datePart:string}". Expected one of {validDateParts:string}',
    "es-es":
      'Parte de la fecha no válida "{datePart:string}". Se esperaba {validDateParts:string}',
    "fr-fr":
      'Partie de date "{datePart:string}" non valide. Attendu l\'un des {validDateParts:string}',
    "ru-ru":
      "Неверная часть даты «{datePart:string}». Ожидается {validDateParts:string}.",
    "uk-ua":
      'Недійсна частина дати "{datePart:string}". Очікується один із {validDateParts:string}',
    "de-ch":
      'Ungültiger Datumsteil "{datePart:string}". Erwartet wurde einer von {validDateParts:string}',
    "pt-br":
      'Parte da data inválida "{datePart:string}". Esperava-se uma de {validDateParts:string}',
  },
  invalidUploadStatus: {
    "en-us":
      'Invalid status "{uploadStatus:string}" for {operation:string}. Expected {expectedUploadStatus:string}',
    "es-es":
      'Estado no válido "{uploadStatus:string}" para {operation:string}. Se esperaba {expectedUploadStatus:string}',
    "fr-fr":
      'Statut non valide "{uploadStatus:string}" pour {operation:string}. Attendu {expectedUploadStatus:string}',
    "ru-ru":
      "Недопустимый статус «{uploadStatus:string}» для {operation:string}. Ожидается {expectedUploadStatus:string}.",
    "uk-ua":
      'Недійсний статус "{uploadStatus:string}" для {operation:string}. Очікується {expectedUploadStatus:string}',
    "de-ch":
      'Ungültiger Status "{uploadStatus:string}" für {operation:string}. Erwartet: {expectedUploadStatus:string}',
    "pt-br":
      'Status inválido "{uploadStatus:string}" para {operation:string}. Esperado {expectedUploadStatus:string}',
  },
  datasetAlreadyUploaded: {
    "en-us": "Dataset already uploaded",
    "es-es": "Conjunto de datos ya subido",
    "fr-fr": "Ensemble de données déjà téléchargé",
    "ru-ru": "Набор данных уже загружен",
    "uk-ua": "Таблиця уже завантажена",
    "de-ch": "Datensatz bereits hochgeladen",
    "pt-br": "Conjunto de dados já carregado",
  },
  scopeChangeDetected: {
    "en-us":
      "Scope change detected in this row. It is recommended to delete this row from the dataset",
    "de-ch":
      "In dieser Zeile wurde eine Bereichsänderung festgestellt. Es wird empfohlen, diese Zeile aus dem Datensatz zu löschen.",
    "es-es":
      "Se detectó un cambio de alcance en esta fila. Se recomienda eliminarla del conjunto de datos.",
    "fr-fr":
      "Modification de portée détectée dans cette ligne. Il est recommandé de supprimer cette ligne de l'ensemble de données.",
    "pt-br":
      "Alteração de escopo detectada nesta linha. Recomenda-se excluir esta linha do conjunto de dados.",
    "ru-ru":
      "В этой строке обнаружено изменение области действия. Рекомендуется удалить эту строку из набора данных.",
    "uk-ua":
      "У цьому рядку виявлено зміну області застосування. Рекомендується видалити цей рядок з набору даних",
  },
  multipleTreeDefsInRow: {
    "en-us": "Multiple tree definitions in row",
    "de-ch": "Mehrere Baumdefinitionen in einer Zeile",
    "es-es": "Varias definiciones de árboles en fila",
    "fr-fr": "Plusieurs définitions d'arbres dans la ligne",
    "pt-br": "Várias definições de árvores em linha",
    "ru-ru": "Несколько определений деревьев в строке",
    "uk-ua": "Кілька визначень дерев у рядку",
  },
  invalidCotype: {
    "en-us": "Invalid type for selected tree rank(s)",
    "de-ch": "Ungültiger Typ für ausgewählte(n) Baumrang(e)",
    "es-es": "Tipo no válido para el rango de árbol seleccionado",
    "fr-fr": "Type non valide pour le(s) rang(s) d'arbre sélectionné(s)",
    "pt-br": "Tipo inválido para classificação de árvore selecionada",
    "ru-ru": "Недопустимый тип для выбранного ранга дерева",
    "uk-ua": "Недійсний тип для вибраного(их) рангу(ів) дерева",
  },
} as const);
