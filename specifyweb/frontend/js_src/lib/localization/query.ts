/**
 * Localization strings from the query builder
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const queryText = createDictionary({
  query: {
    'en-us': 'Query',
    'ru-ru': 'Запрос',
    'es-es': 'Consulta',
    'fr-fr': 'Mettre en doute',
    'uk-ua': 'Запит',
  },
  queries: {
    'en-us': 'Queries',
    'ru-ru': 'Запросы',
    'es-es': 'Consultas',
    'fr-fr': 'Requêtes',
    'uk-ua': 'Запити',
  },
  queryBuilder: {
    'en-us': 'Query Builder',
    'ru-ru': 'Конструктор запросов',
    'es-es': 'Consultor de construcción',
    'fr-fr': 'Générateur de requêtes',
    'uk-ua': 'Конструктор запитів',
  },
  newQueryName: {
    'en-us': 'New Query',
    'ru-ru': 'Новый запрос',
    'es-es': 'Nueva consulta',
    'fr-fr': 'Nouvelle requête',
    'uk-ua': 'Новий запит',
  },
  searchFields: {
    comment: `
      Used in a Query Combo Box's hover-over message to show which fields are
      being searched on
    `,
    'en-us': 'Searched fields',
    'ru-ru': 'Поля поиска',
    'es-es': 'Campos buscados',
    'fr-fr': 'Champs recherchés',
    'uk-ua': 'Пошукові поля',
  },
  any: {
    'en-us': 'Any',
    'ru-ru': 'Любой',
    'es-es': 'Cualquier',
    'fr-fr': "N'importe quel",
    'uk-ua': 'Будь-який',
  },
  startValue: {
    'en-us': 'Start Value',
    'ru-ru': 'Начальное значение',
    'es-es': 'Valor inicial',
    'fr-fr': 'Valeur de départ',
    'uk-ua': 'Початкове значення',
  },
  endValue: {
    'en-us': 'End Value',
    'ru-ru': 'Конечное значение',
    'es-es': 'Valor final',
    'fr-fr': 'Valeur finale',
    'uk-ua': 'Кінцеве значення',
  },
  saveQuery: {
    'en-us': 'Save Query',
    'ru-ru': 'Сохранить запрос',
    'es-es': 'Guardar consulta',
    'fr-fr': 'Enregistrer la requête',
    'uk-ua': 'Зберегти запит',
  },
  saveClonedQuery: {
    'en-us': 'Save query as...',
    'ru-ru': 'Сохранить запрос как...',
    'es-es': 'Guardar consulta como...',
    'fr-fr': 'Enregistrer la requête sous...',
    'uk-ua': 'Зберегти запит як...',
  },
  saveClonedQueryDescription: {
    'en-us': `
      The query will be saved with a new name leaving the current query
      unchanged.
    `,
    'ru-ru': `
      Запрос будет сохранен под новым именем, оставив текущий запрос без
      изменений.
    `,
    'es-es': `
      La consulta se guardará con un nuevo nombre dejando la consulta actual sin
      cambios.
    `,
    'fr-fr': `
      La requête sera enregistrée avec un nouveau nom laissant la requête
      actuelle inchangée.
    `,
    'uk-ua': `
      Запит буде збережено з новою назвою, а поточний запит залишиться без змін.
    `,
  },
  queryDeleteIncomplete: {
    'en-us': 'Query definition contains incomplete fields',
    'ru-ru': 'Определение запроса содержит неполные поля',
    'es-es': 'La definición de consulta contiene campos incompletos',
    'fr-fr': 'La définition de la requête contient des champs incomplets',
    'uk-ua': 'Визначення запиту містить незаповнені поля',
  },
  queryDeleteIncompleteDescription: {
    'en-us': `
      There are uncompleted fields in the query definition. Do you want to
      remove them?
    `,
    'ru-ru': 'В запросе есть незавершенные поля. Хотите удалить их?',
    'es-es': `
      Hay campos sin completar en la definición de consulta. ¿Quieres
      eliminarlos?
    `,
    'fr-fr': `
      Il y a des champs incomplets dans la définition de la requête. Voulez-vous
      les supprimer ?
    `,
    'uk-ua': 'У визначенні запиту є незаповнені поля. Ви хочете видалити їх?',
  },
  queryUnloadProtect: {
    'en-us': 'The new or modified query definition has not been saved',
    'ru-ru': 'Новый или измененный запрос не был сохранен',
    'es-es': 'La definición de consulta nueva o modificada no se ha guardado',
    'fr-fr':
      "La définition de requête nouvelle ou modifiée n'a pas été enregistrée",
    'uk-ua': 'Нове або змінене визначення запиту не було збережено',
  },
  recordSetToQuery: {
    comment: 'Example: Creating a Record Set from Query',
    'en-us': 'Creating a {recordSetTable:string} from Query',
    'ru-ru': 'Создание {recordSetTable:string} из запроса',
    'es-es': 'Creando un {recordSetTable:string} desde Query',
    'fr-fr': "Création d'un {recordSetTable:string} à partir d'une requête",
    'uk-ua': 'Створення {recordSetTable:string} із запиту',
  },
  recordSetToQueryDescription: {
    'en-us': 'Generating {recordSetTable:string}...',
    'ru-ru': 'Создание {recordSetTable:string}...',
    'es-es': 'Generando {recordSetTable:string}...',
    'fr-fr': 'Génération de {recordSetTable:string}...',
    'uk-ua': 'Створення {recordSetTable:string}...',
  },
  recordSetCreated: {
    'en-us': '{recordSetTable:string} Created',
    'ru-ru': '{recordSetTable:string} Созданный',
    'es-es': '{recordSetTable:string} Creado',
    'fr-fr': '{recordSetTable:string} créé',
    'uk-ua': '{recordSetTable:string} Створено',
  },
  missingCoordinatesForKml: {
    'en-us': 'Unable to export to KML',
    'ru-ru': 'Невозможно экспортировать в KML',
    'es-es': 'No se puede exportar a KML',
    'fr-fr': "Impossible d'exporter vers KML",
    'uk-ua': 'Не вдалося експортувати в KML',
  },
  missingCoordinatesForKmlDescription: {
    'en-us': 'Please add latitude and longitude fields to the query.',
    'ru-ru': 'Пожалуйста, добавьте в запрос поля широты и долготы.',
    'es-es': 'Agregue campos de latitud y longitud a la consulta.',
    'fr-fr':
      'Veuillez ajouter des champs de latitude et de longitude à la requête.',
    'uk-ua': 'Будь ласка, додайте поля широти та довготи до запиту.',
  },
  queryExportStarted: {
    'en-us': 'Export File Being Created',
    'ru-ru': 'Экспорт запроса запущен',
    'es-es': 'Exportar archivo que se está creando',
    'fr-fr': "Fichier d'exportation en cours de création",
    'uk-ua': 'Експортний файл створюється',
  },
  queryExportStartedDescription: {
    'en-us': `
      A notification will appear when the export file is complete and ready for
      download.
    `,
    'ru-ru': `
      Запрос начал выполняться. Вы получите уведомление, когда файл будет готов
      к загрузке.
    `,
    'es-es': `
      Aparecerá una notificación cuando el archivo de exportación esté completo
      y listo para descargar.
    `,
    'fr-fr': `
      Une notification apparaîtra lorsque le fichier d'exportation sera terminé
      et prêt à être téléchargé.
    `,
    'uk-ua': `
      Коли файл експорту буде завершено та готовий до завантаження, з’явиться
      сповіщення.
    `,
  },
  invalidPicklistValue: {
    comment: 'Used when selected pick list value is not one of allowed values',
    'en-us': '{value:string} (current, invalid value)',
    'ru-ru': '{value:string} (текущее, недопустимое значение)',
    'es-es': '{value:string} (valor actual no válido)',
    'fr-fr': '{value:string} (valeur actuelle, invalide)',
    'uk-ua': '{value:string} (поточне, недійсне значення)',
  },
  queryRecordSetTitle: {
    comment: 'Used in query builder header when querying on record set',
    'en-us': `
      Query: "{queryName:string}" on
      {recordSetTable:string}: "{recordSetName:string}"
    `,
    'ru-ru': `
      Запрос: "{queryName:string}" на
      {recordSetTable:string}: "{recordSetName:string}"
    `,
    'es-es': `
      Consulta: "{queryName:string}" en
      {recordSetTable:string}: "{recordSetName:string}"
    `,
    'fr-fr': `
      Requête : "{queryName:string}" sur
      {recordSetTable:string} : "{recordSetName:string}"
    `,
    'uk-ua': `
      Запит: "{queryName:string}" на
      {recordSetTable:string}: "{recordSetName:string}"
    `,
  },
  treeQueryName: {
    comment: 'Used in query builder header when querying on tree node usages',
    'en-us': '{tableName:string} using "{nodeFullName:string}',
    'ru-ru': '{tableName:string} с использованием "{nodeFullName:string}"',
    'es-es': '{tableName:string} usando "{nodeFullName:string}',
    'fr-fr': '{tableName:string} en utilisant "{nodeFullName:string}',
    'uk-ua': '{tableName:string} за допомогою "{nodeFullName:string}',
  },
  newButtonDescription: {
    'en-us': 'Add New Field',
    'ru-ru': 'Добавить новое поле',
    'es-es': 'Agregar nuevo campo',
    'fr-fr': 'Ajouter un nouveau champ',
    'uk-ua': 'Додати нове поле',
  },
  countOnly: {
    'en-us': 'Count',
    'ru-ru': 'Считать',
    'es-es': 'Contar',
    'fr-fr': 'Compter',
    'uk-ua': 'Рахувати',
  },
  distinct: {
    'en-us': 'Distinct',
    'ru-ru': 'Отчетливый',
    'es-es': 'Distinto',
    'fr-fr': 'Distinct',
    'uk-ua': 'Виразний',
  },
  createCsv: {
    'en-us': 'Create CSV',
    'ru-ru': 'Создать CSV',
    'es-es': 'Crear CSV',
    'fr-fr': 'Créer un CSV',
    'uk-ua': 'Створити CSV',
  },
  createKml: {
    'en-us': 'Create KML',
    'ru-ru': 'Создать KML',
    'es-es': 'Crear archivo KML',
    'fr-fr': 'Créer un KML',
    'uk-ua': 'Створіть KML',
  },
  createRecordSet: {
    'en-us': 'Create {recordSetTable:string}',
    'ru-ru': 'Сделать {recordSetTable:string}',
    'es-es': 'Crear {recordSetTable:string}',
    'fr-fr': 'Créer {tableInformationRequest:string}',
    'uk-ua': 'Створити {modelName:string}',
  },
  saveAs: {
    'en-us': 'Save As',
    'ru-ru': 'Сохранить как',
    'es-es': 'Guardar como',
    'fr-fr': 'Enregistrer sous',
    'uk-ua': 'Зберегти як',
  },
  anyRank: {
    'en-us': '(any rank)',
    'ru-ru': '(любой ранг)',
    'es-es': '(cualquier rango)',
    'fr-fr': '(tout grade)',
    'uk-ua': '(будь-який ранг)',
  },
  moveUp: {
    'en-us': 'Move Up',
    'ru-ru': 'Переместить вверх',
    'es-es': 'Ascender',
    'fr-fr': 'Déplacer vers le haut',
    'uk-ua': 'Рухатися вгору',
  },
  moveDown: {
    'en-us': 'Move Down',
    'ru-ru': 'Переместить вниз',
    'es-es': 'Mover hacia abajo',
    'fr-fr': 'Descendre',
    'uk-ua': 'Рухатися вниз',
  },
  sort: {
    'en-us': 'Sort',
    'ru-ru': 'Сортировать',
    'es-es': 'Clasificar',
    'fr-fr': 'Trier',
    'uk-ua': 'Сортувати',
  },
  ascendingSort: {
    'en-us': 'Ascending Sort',
    'ru-ru': 'Сортировка по возрастанию',
    'es-es': 'orden ascendente',
    'fr-fr': 'Tri croissant',
    'uk-ua': 'Сортування за зростанням',
  },
  descendingSort: {
    'en-us': 'Descending Sort',
    'ru-ru': 'Сортировка по убыванию',
    'es-es': 'orden descendente',
    'fr-fr': 'Tri décroissant',
    'uk-ua': 'Сортування за спаданням',
  },
  negate: {
    'en-us': 'Negate',
    'ru-ru': 'Отрицать',
    'es-es': 'Negar',
    'fr-fr': 'Nier',
    'uk-ua': 'Заперечувати',
  },
  showButtonDescription: {
    'en-us': 'Show in results',
    'ru-ru': 'Показывать в результатах',
    'es-es': 'Mostrar en resultados',
    'fr-fr': 'Afficher dans les résultats',
    'uk-ua': 'Показати в результатах',
  },
  aggregatedInline: {
    'en-us': '(aggregated)',
    'ru-ru': '(совокупный)',
    'es-es': '(agregado)',
    'fr-fr': '(agrégé)',
    'uk-ua': '(узагальнено)',
  },
  formattedInline: {
    'en-us': '(formatted)',
    'ru-ru': '(отформатирован)',
    'es-es': '(formateado)',
    'fr-fr': '(formaté)',
    'uk-ua': '(відформатований)',
  },
  like: {
    'en-us': 'Like',
    'ru-ru': 'Подобно',
    'es-es': 'Como',
    'fr-fr': 'Comme',
    'uk-ua': 'Люблю',
  },
  likeDescription: {
    comment: 'Explains the use of special symbols for the "like" query filter',
    'en-us': `
      Use "%" to match any number of characters.

      Use "_" to match a single character
    `,
    'ru-ru': `
      Используйте «%» для соответствия любому количеству символов.

      Используйте «_» для соответствия одному символу
    `,
    'es-es': `
      Utilice "%" para hacer coincidir cualquier número de caracteres.

      Use "_" para hacer coincidir un solo carácter
    `,
    'fr-fr': `
      Utilisez "%" pour correspondre à n\'importe quel nombre de caractères.

      Utilisez "_" pour correspondre à un seul caractère
    `,
    'uk-ua': `
      Використовуйте "%", щоб відповідати будь-якій кількості символів.

      Використовуйте "_", щоб відповідати одному символу
    `,
  },
  equal: {
    'en-us': 'Equal',
    'ru-ru': 'Равный',
    'es-es': 'Igual',
    'fr-fr': 'Égal',
    'uk-ua': 'Рівні',
  },
  greaterThan: {
    'en-us': 'Greater than',
    'ru-ru': 'Больше чем',
    'es-es': 'Mas grande que',
    'fr-fr': 'Plus grand que',
    'uk-ua': 'Більш чим',
  },
  lessThan: {
    'en-us': 'Less than',
    'ru-ru': 'Меньше чем',
    'es-es': 'Menos que',
    'fr-fr': 'Moins que',
    'uk-ua': 'Менше ніж',
  },
  greaterOrEqualTo: {
    'en-us': 'Greater or Equal to',
    'ru-ru': 'Больше или равно',
    'es-es': 'mayor o igual a',
    'fr-fr': 'Supérieur ou égal à',
    'uk-ua': 'Більше або дорівнює',
  },
  lessOrEqualTo: {
    'en-us': 'Less or Equal to',
    'ru-ru': 'Меньше или равно',
    'es-es': 'menor o igual a',
    'fr-fr': 'Inférieur ou égal à',
    'uk-ua': 'Менше або дорівнює',
  },
  true: {
    'en-us': 'True',
    'ru-ru': 'Истинный',
    'es-es': 'Verdadero',
    'fr-fr': 'Vrai',
    'uk-ua': 'правда',
  },
  false: {
    'en-us': 'False',
    'ru-ru': 'Ложь',
    'es-es': 'FALSO',
    'fr-fr': 'FAUX',
    'uk-ua': 'помилковий',
  },
  trueOrNull: {
    'en-us': 'True or Empty',
    'ru-ru': 'Истинный или пустой',
    'es-es': 'Verdadero o Vacío',
    'fr-fr': 'Vrai ou vide',
    'uk-ua': 'True або Empty',
  },
  falseOrNull: {
    'en-us': 'False or Empty',
    'ru-ru': 'Ложь или пустой',
    'es-es': 'Falso o Vacío',
    'fr-fr': 'Faux ou vide',
    'uk-ua': 'False або Empty',
  },
  between: {
    'en-us': 'Between',
    'ru-ru': 'Между',
    'es-es': 'Entre',
    'fr-fr': 'Entre',
    'uk-ua': 'Між',
  },
  in: {
    'en-us': 'In',
    'ru-ru': 'В',
    'es-es': 'En',
    'fr-fr': 'Dans',
    'uk-ua': 'в',
  },
  inDescription: {
    'en-us': 'A comma-separated list of values',
    'ru-ru': 'Список значений, разделенных запятыми',
    'es-es': 'Una lista de valores separados por comas',
    'fr-fr': 'Une liste de valeurs séparées par des virgules',
    'uk-ua': 'Список значень, розділених комами',
  },
  contains: {
    'en-us': 'Contains',
    'ru-ru': 'Содержит',
    'es-es': 'Contiene',
    'fr-fr': 'Contient',
    'uk-ua': 'Містить',
  },
  empty: {
    'en-us': 'Empty',
    'ru-ru': 'Пустой',
    'es-es': 'Vacío',
    'fr-fr': 'Vide',
    'uk-ua': 'Порожній',
  },
  and: {
    'en-us': 'and',
    'ru-ru': 'и',
    'es-es': 'y',
    'fr-fr': 'et',
    'uk-ua': 'і',
  },
  startsWith: {
    'en-us': 'Starts With',
    'ru-ru': 'Начинается с',
    'es-es': 'Comienza con',
    'fr-fr': 'Commence avec',
    'uk-ua': 'Починається з',
  },
  or: {
    'en-us': 'or',
    'ru-ru': 'или',
    'es-es': 'o',
    'fr-fr': 'ou',
    'uk-ua': 'або',
  },
  yes: {
    'en-us': 'Yes',
    'ru-ru': 'Да',
    'es-es': 'Sí',
    'fr-fr': 'Oui',
    'uk-ua': 'Так',
  },
  noPreparationsToReturn: {
    'en-us': 'There are no unresolved items to return',
    'ru-ru': 'Нет нерешенных приготовлений к возвращению',
    'es-es': 'No hay elementos sin resolver para devolver',
    'fr-fr': "Il n'y a aucun élément non résolu à retourner",
    'uk-ua': 'Немає невирішених елементів для повернення',
  },
  itemsReturned: {
    'en-us': 'Items have been returned',
    'ru-ru': 'Items have been returned',
    'es-es': 'Los artículos han sido devueltos',
    'fr-fr': 'Les articles ont été retournés',
    'uk-ua': 'Товари повернуто',
  },
  queryResults: {
    'en-us': 'Query Results',
    'ru-ru': 'Результаты запроса',
    'es-es': 'Resultados de la consulta',
    'fr-fr': 'Résultats de la requête',
    'uk-ua': 'Результати запиту',
  },
  browseInForms: {
    'en-us': 'Browse in Forms',
    'ru-ru': 'Открыть записи',
    'es-es': 'Navegar en Formularios',
    'fr-fr': 'Naviguer dans les formulaires',
    'uk-ua': 'Перегляд у Формах',
  },
  editQuery: {
    'en-us': 'Edit Query',
    'ru-ru': 'Редактировать запрос',
    'es-es': 'Editar consulta',
    'fr-fr': 'Modifier la requête',
    'uk-ua': 'Редагувати запит',
  },
  configureQueryTables: {
    'en-us': 'Configure visible query tables',
    'ru-ru': 'Настроить видимые таблицы запроса',
    'es-es': 'Configurar tablas de consulta visibles',
    'fr-fr': 'Configurer des tables de requêtes visibles',
    'uk-ua': 'Налаштувати видимі таблиці запитів',
  },
  exportQueryForDwca: {
    'en-us': 'Export query for DwCA definition',
    'ru-ru': 'Экспорт запрос для DwCA',
    'es-es': 'Consulta de exportación para la definición de DwCA',
    'fr-fr': "Requête d'exportation pour la définition DwCA",
    'uk-ua': 'Експорт запиту для визначення DwCA',
  },
  exportQueryAsReport: {
    'en-us': 'Define report based on query',
    'ru-ru': 'Определите отчет на основе запроса',
    'es-es': 'Definir informe basado en consulta',
    'fr-fr': 'Définir le rapport en fonction de la requête',
    'uk-ua': 'Визначити звіт на основі запиту',
  },
  exportQueryAsLabel: {
    'en-us': 'Define label based on query',
    'ru-ru': 'Определите метку на основе запроса',
    'es-es': 'Definir etiqueta basada en consulta',
    'fr-fr': "Définir l'étiquette en fonction de la requête",
    'uk-ua': 'Визначте мітку на основі запиту',
  },
  treeMerge: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Merge',
    'ru-ru': 'Слияние узлов дерева',
    'es-es': 'Fusión de árboles',
    'fr-fr': "Fusion d'arborescence",
    'uk-ua': "Об'єднання дерев",
  },
  treeMove: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Move',
    'ru-ru': 'Перемещение узла дерева',
    'es-es': 'Mover árbol',
    'fr-fr': "Déplacement d'arbre",
    'uk-ua': 'Переміщення дерева',
  },
  treeSynonymize: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Synonymize',
    'ru-ru': 'Синонимизированный узел дерева',
    'es-es': 'Árbol Sinonimizar',
    'fr-fr': "Synonymiser l'arbre",
    'uk-ua': 'Синонімізувати дерево',
  },
  treeDesynonymize: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Desynonymize',
    'ru-ru': 'Отменено синонимизацию узла дерева',
    'es-es': 'Árbol Desinonimizar',
    'fr-fr': 'Arbre désynonymiser',
    'uk-ua': 'Десинонімізація дерева',
  },
  tooLongErrorMessage: {
    'en-us': `
      Field value is too long. Max allowed length is
      {maxLength:number|formatted}
    `,
    'ru-ru': `
      Значение поля слишком длинное. Максимально допустимая длина
      {maxLength:number|formatted}
    `,
    'es-es': `
      El valor del campo es demasiado largo. La longitud máxima permitida es
      {maxLength:number|formatted}
    `,
    'fr-fr': `
      La valeur du champ est trop longue. La longueur maximale autorisée est
      {maxLength:number|formatted}
    `,
    'uk-ua': `
      Значення поля задовге. Максимальна дозволена довжина
      {maxLength:number|formatted}
    `,
  },
  future: {
    'en-us': 'Future',
  },
  past: {
    'en-us': 'Past',
  },
  day: {
    'en-us': 'Day',
  },
  week: {
    'en-us': 'Week',
  },
  month: {
    'en-us': 'Month',
  },
  year: {
    'en-us': 'Year',
  },
  importHiddenFields: {
    'en-us': 'The following fields are hidden in the query you imported:',
    'es-es': 'Los siguientes campos están ocultos en la consulta que importó:',
    'fr-fr': `
      Les champs suivants sont masqués dans la requête que vous avez importée :
    `,
    'ru-ru': 'В импортированном запросе скрыты следующие поля:',
    'uk-ua': 'В імпортованому вами запиті приховано такі поля:',
  },
  importNoReadPermission: {
    'en-us':
      'The query you imported contains tables you do not have read access to:',
    'es-es': `
      La consulta que importó contiene tablas a las que no tiene acceso de
      lectura:
    `,
    'fr-fr': `
      La requête que vous avez importée contient des tables auxquelles vous
      n'avez pas accès en lecture :
    `,
    'ru-ru': `
      Импортированный запрос содержит таблицы, к которым у вас нет доступа для
      чтения:
    `,
    'uk-ua': `
      Запит, який ви імпортували, містить таблиці, до яких ви не маєте доступу
      на читання:
    `,
  },
  noReadPermission: {
    'en-us': 'No read permission',
    'es-es': 'Sin permiso de lectura',
    'fr-fr': "Pas d'autorisation de lecture",
    'ru-ru': 'Нет разрешения на чтение',
    'uk-ua': 'Немає дозволу на читання',
  },
} as const);
