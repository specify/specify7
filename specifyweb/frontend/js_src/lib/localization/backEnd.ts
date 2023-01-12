/**
 * Localization for strings that are returned from the back-end. (back-end
 * returns a key, and front-end resolves the key into a string)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const backEndText = createDictionary({

  ///////////////////////
  /* Workbench Results */
  ///////////////////////

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

  ///////////////////////
  /* Error Parsing     */
  ///////////////////////
  showTraceback : {
    'en-us':'Show Traceback',
  },
  fieldNotUnique : {
    'en-us' : '{tableName:string} must have unique {fieldName:string}',
  },
  childFieldNotUnique : {
    'en-us' : '{tableName:string} must have unique {fieldName:string} in {parentField:string}',
  },
  /// TreeBusinessRuleExceptions
  deletingTreeRoot : {
    'en-us': 'Can not delete root level tree definition item',
  },
  nodeParentInvalidRank : {
    'en-us' : "Tree node's parent has rank greater than itself",
  },
  nodeChildrenInvalidRank : {
    'en-us' : "Tree node's rank is greater than some of its children",
  },
  nodeOperationToSynonymizedParent : {
    'en-us' : "{operation:string} node '{nodeName:string}' to synonymized parent '{parentName:string}'",
  },
  nodeSynonymizeToSynonymized : {
    'en-us' : "Synonymizing '{nodeName:string}' to synonymized node '{intoName:string}'",
  },
  nodeSynonimizeWithChildren : {
    'en-us' : "Synonimizing node '{nodeName:string}' which has children",
  },

  /// Assertion Errors 

  // Trees //
  badTreeStructureInvalidRanks : {
    'en-us' : 'Bad Tree Structure: Found {badRanks:number} cases where node rank is not greater than its parent',
  },
  invalidNodeType : {
    'en-us' : "Unexpected type of node '{node:string}' during {operation:string}. Expected '{nodeModel:string}'",
  },
  mergeAcrossTrees : {
    'en-us' : 'Merging across trees',
  },
  synonymizeAcrossTrees :{
    'en-us': 'Synonymizing across trees'
  },

  // Determination // 
  limitReachedDeterminingAccepted : {
    'en-us': 'Could not find accepted taxon for synonymized taxon (id = {taxonId:number})'
  },

  // Permissions // 
  resourceInPermissionRegistry : {
    'en-us' : 'Resource {resource:string} already in Permissions registry',
  },
  actorIsNotSpecifyUser: {
    'en-us' : 'Agent {actor:string} is not a SpecifyUser',
  },
  unexpectedCollectionType : {
    'en-us' : "Unexpected type of collection '{unexpectedTypeName:string}'. Expected '{collectionName:string}'",
  },

  // Reports/Labels //
  invalidReportMimetype : {
    'en-us' : "Can not create report: mimetype not 'jrxml/label' or 'jrxml/report'",
  },

  // Schema //
  fieldNotRelationship : {
    'en-us' : 'Field {field:string} is not a Relationship',
  },
  
  // Queries //
  unexpectedTableId : {
    'en-us' : "Unexpected table id '{tableId:string}' in request. Expected '{expectedTableId:string}'",
  },
  noCollectionInQuery : {
    'en-us' : 'No Collection found in Query for table {table:string}',
  },
  invalidDatePart : {
    'en-us' : "Invalid date part '{datePart:string}'. Expected one of {validDateParts:string}",
  },

  // Workbench // 
  invalidUploadStatus : {
    'en-us' : "Invalid status '{uploadStatus:string}' for {operation:string}. Expected {expectedUploadStatus:string}",
  },
  datasetAlreadyUploaded : {
    'en-us' : 'Dataset already uploaded',
  }

} as const);
